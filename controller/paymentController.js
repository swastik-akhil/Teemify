const crypto = require('crypto');
const Payment = require('../model/paymentModel.js');
const userSchema = require('../model/userModel.js');
const Razorpay = require("razorpay");
const dotenv = require('dotenv');
dotenv.config();


const secretKey = process.env.RAZORPAY_KEY_SECRET;
const key_id = process.env.RAZORPAY_KEY_ID;

const checkout = async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        const options = {
            amount: 3539*100,           //figma design price
            currency: 'INR',
            partial_payment: false,
            payment_capture: 1,
        };

        const order = await instance.orders.create(options);


        return res.status(200).json({
            success: true,
            msg: 'Order Created',
            razorpay_order_id: order.id,
            amount: req.body.amount,
            razorpay_payment_id: key_id,
            createdAt: Date.now(),
            order: order,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
};

const paymentVerification = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id } = req.body;
        const generateRazorpaySignature = (razorpay_order_id, razorpay_payment_id, secretKey) => {
            const text = `${razorpay_order_id}|${razorpay_payment_id}`;
            const razorpay_signature = crypto.createHmac('sha256', secretKey).update(text).digest('hex');
            return razorpay_signature;
        };
        const razorpay_signature = generateRazorpaySignature(razorpay_order_id, razorpay_payment_id, secretKey);

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(body)
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const { razorpay_order_id, razorpay_payment_id } = req.body;

            const payment = new Payment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                createdAt: new Date(),
                paymentStatus: true,
                user: req.user._id,
            });

            await payment.save();

            const user = await userSchema.findById(req.body.userId);
            if (!user) {
                return res.status(404).json({ success: false, msg: 'User not found' });
            }
            // Update user to mark as premium
            await user.markAsPremium();
            await user.save();

            return res.status(200).json({ success: true, msg: 'Payment successful' });
        } else {
            return res.status(400).json({ success: false, msg: 'Invalid Signature' });
        }
    } catch (error) {
        console.error('Error processing payment verification:', error);
        return res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
};

module.exports = {
    checkout,
    paymentVerification,
};
