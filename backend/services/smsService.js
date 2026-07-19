// Mock SMS Service since no specific provider was requested or configured.
// To use Twilio, install 'twilio' package and configure credentials.

const sendSMSOTP = async (toPhoneNumber, otp) => {
    try {
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            console.log(`[MOCK SMS] To: ${toPhoneNumber} | OTP: ${otp}`);
            return true;
        }

        // Example Twilio Implementation:
        // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        // await client.messages.create({
        //     body: `Your Taskify OTP is: ${otp}`,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to: toPhoneNumber
        // });
        
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
};

module.exports = { sendSMSOTP };
