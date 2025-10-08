// Quick WhatsApp API test script
const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const TEST_RECIPIENT = '85265727136'; // First test number

async function testWhatsApp() {
  console.log('Testing WhatsApp API...');
  console.log('Phone Number ID:', WHATSAPP_PHONE_NUMBER_ID ? 'SET ✓' : 'MISSING ✗');
  console.log('Access Token:', WHATSAPP_ACCESS_TOKEN ? 'SET ✓' : 'MISSING ✗');
  
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error('Missing credentials!');
    process.exit(1);
  }

  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  console.log('API URL:', url);
  console.log('Sending to:', TEST_RECIPIENT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: TEST_RECIPIENT,
        type: 'text',
        text: { 
          body: '🧪 PetSOS WhatsApp Test\n\nThis is a test message from PetSOS emergency broadcast system.\n\nIf you receive this, the integration is working!' 
        },
      }),
    });

    console.log('Response Status:', response.status);
    const data = await response.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ SUCCESS! WhatsApp message sent successfully!');
    } else {
      console.log('❌ FAILED! Check the error above.');
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

testWhatsApp();
