import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const fromNumber = process.env.TWILIO_PHONE_NUMBER!

export const twilioClient = twilio(accountSid, authToken)

export interface SMSMessage {
  to: string
  body: string
  from?: string
}

export async function sendSMS({ to, body, from = fromNumber }: SMSMessage) {
  try {
    const message = await twilioClient.messages.create({
      body,
      from,
      to,
    })

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
    }
  } catch (error) {
    console.error('Error sending SMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getMessageStatus(messageSid: string) {
  try {
    const message = await twilioClient.messages(messageSid).fetch()
    return {
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    }
  } catch (error) {
    console.error('Error fetching message status:', error)
    return null
  }
}
