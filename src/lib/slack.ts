import { WebClient } from '@slack/web-api';
import { formatDateRange } from './rules'
import crypto from 'crypto'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

export interface ApprovalRequest {
  requestId: string
  parentName: string
  dogName: string
  parentEmail: string
  parentPhone: string
  startDate: string
  endDate: string
  dogBreed?: string
  dogAge?: number
  availabilityMessage: string
}

export async function postApprovalRequest(request: ApprovalRequest) {
  const dateRange = formatDateRange(request.startDate, request.endDate)
  
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🐕 New Boarding Request'
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Parent:* ${request.parentName}`
        },
        {
          type: 'mrkdwn',
          text: `*Dog:* ${request.dogName}`
        },
        {
          type: 'mrkdwn',
          text: `*Email:* ${request.parentEmail}`
        },
        {
          type: 'mrkdwn',
          text: `*Phone:* ${request.parentPhone}`
        },
        {
          type: 'mrkdwn',
          text: `*Dates:* ${dateRange}`
        },
        {
          type: 'mrkdwn',
          text: `*Breed:* ${request.dogBreed || 'Not specified'}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Calendar Availability:*\n${request.availabilityMessage}`
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '✅ Approve'
          },
          style: 'primary',
          action_id: 'approve_booking',
          value: request.requestId
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '❌ Deny'
          },
          style: 'danger',
          action_id: 'deny_booking',
          value: request.requestId
        }
      ]
    }
  ]

  try {
    const result = await slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID!,
      text: `New boarding request from ${request.parentName} for ${request.dogName}`,
      blocks
    })

    return result.ts // Return message timestamp for later updates
  } catch (error) {
    console.error('Failed to post to Slack:', error)
    throw error
  }
}

export async function updateApprovalMessage(
  messageTs: string,
  status: 'approved' | 'denied',
  approverName?: string
) {
  const statusEmoji = status === 'approved' ? '✅' : '❌'
  const statusText = status === 'approved' ? 'APPROVED' : 'DENIED'
  const approver = approverName ? ` by ${approverName}` : ''

  try {
    await slack.chat.update({
      channel: process.env.SLACK_CHANNEL_ID!,
      ts: messageTs,
      text: `Booking request ${statusText}${approver}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${statusEmoji} *${statusText}*${approver}`
          }
        }
      ]
    })
  } catch (error) {
    console.error('Failed to update Slack message:', error)
    throw error
  }
}

export function verifySlackSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET!
  
  // Check if timestamp is within 5 minutes
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false
  }

  // Create signature
  const hmac = crypto.createHmac('sha256', signingSecret)
  hmac.update(`v0:${timestamp}:${body}`)
  const computedSignature = `v0=${hmac.digest('hex')}`

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )
}
