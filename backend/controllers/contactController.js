const nodemailer = require('nodemailer');

// Configure email transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'devincode1@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'mnzb ndts msgu tobw'
  }
});

const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }

    // Compose email
    const mailOptions = {
      from: 'devincode1@gmail.com',
      to: 'devincode1@gmail.com',
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #0077b5; padding-bottom: 10px;">New Contact Form Submission</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name/ID:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #e9f5ff; padding: 20px; border-radius: 5px; border-left: 4px solid #0077b5;">
            <h3 style="margin-top: 0; color: #0077b5;">Message:</h3>
            <p style="white-space: pre-wrap; color: #333;">${message}</p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This message was sent from the DevOps Pipeline Generator contact form.
          </p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'Contact form submitted successfully' 
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit contact form' 
    });
  }
};

module.exports = {
  submitContact
};
