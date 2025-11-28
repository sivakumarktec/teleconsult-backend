const nodemailer = require("nodemailer");

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(options) {
    try {
      await this.transporter.sendMail({
        from: `TeleConsult <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log("✅ Email sent successfully");
    } catch (error) {
      console.error("❌ Email send error:", error);
    }
  }

  async sendMeetingScheduled(meeting) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Meeting Scheduled</h2>
        <p>Hello ${meeting.patientName},</p>
        <p>Your teleconsultation has been scheduled with Dr. ${
          meeting.doctor.name
        }.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date:</strong> ${new Date(
            meeting.scheduledDate
          ).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${meeting.scheduledTime}</p>
          <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
        </div>
        <a href="${meeting.meetingLink}" 
           style="background: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Join Meeting
        </a>
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
          Please join the waiting room 5 minutes before your scheduled time.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: meeting.patient.email,
      subject: "Teleconsultation Scheduled",
      html,
    });

    // Send socket notification
    if (global.io) {
      global.io.to(`patient-${meeting.patient._id}`).emit("meeting-scheduled", {
        meeting: meeting._id,
        message: "Your consultation has been scheduled",
      });
    }
  }

  async sendMeetingCancelled(meeting) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Meeting Cancelled</h2>
        <p>Hello ${meeting.patientName},</p>
        <p>Unfortunately, your teleconsultation scheduled for ${new Date(
          meeting.scheduledDate
        ).toLocaleDateString()} 
           at ${meeting.scheduledTime} has been cancelled.</p>
        <p>Please contact our support team to reschedule your appointment.</p>
      </div>
    `;

    await this.sendEmail({
      to: meeting.patient.email,
      subject: "Teleconsultation Cancelled",
      html,
    });
  }

  async sendMeetingReminder(meeting) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Meeting Reminder</h2>
        <p>Hello ${meeting.patientName},</p>
        <p>This is a reminder that your teleconsultation is scheduled in 1 hour.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Time:</strong> ${meeting.scheduledTime}</p>
          <p><strong>Doctor:</strong> Dr. ${meeting.doctor.name}</p>
        </div>
        <a href="${meeting.meetingLink}" 
           style="background: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Join Meeting
        </a>
      </div>
    `;

    await this.sendEmail({
      to: meeting.patient.email,
      subject: "Meeting Reminder - Starting Soon",
      html,
    });
  }

  notifyDoctorPatientWaiting(doctorId, patientName) {
    if (global.io) {
      global.io.to(`doctor-${doctorId}`).emit("patient-waiting", {
        message: `${patientName} is in the waiting room`,
        timestamp: new Date(),
      });
    }
  }

  notifyPatientAdmitted(patientId, meetingLink) {
    if (global.io) {
      global.io.to(`patient-${patientId}`).emit("admitted-to-meeting", {
        message: "You have been admitted to the consultation",
        meetingLink,
        timestamp: new Date(),
      });
    }
  }
}

module.exports = new NotificationService();
