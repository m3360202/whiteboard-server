import bodyParser from 'body-parser';
import { WebApp } from 'meteor/webapp';
import UserDataProvider from './data/UserDataProvider';
import stripePackage from 'stripe';
import {Meteor} from 'meteor/meteor';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_ENDPOINT_SECRET;
const STRIPE_RETURN_LINK = process.env.STRIPE_RETURN_LINK;
const STRIPE_PAYMENT_LINK = process.env.STRIPE_PAYMENT_LINK;

const stripe = stripePackage(STRIPE_SECRET_KEY);

async function getCustomerEmail(customerId) {
    try {
        const customer = await stripe.customers.retrieve(customerId);
        return customer.email;
    } catch (error) {
        console.error('Error fetching customer:', error);
        return null;
    }
}

async function handleSubscriptionEvent(event, subscriptionStatus) {
    const customerEmail = await getCustomerEmail(event.data.object.customer);
    if (customerEmail) {
        const user = await UserDataProvider.getProviderInstance().getByEmailAddress(customerEmail);
        console.log('user', user)
        if (user) {
            await UserDataProvider.getProviderInstance().updateUserAccount(user._id, { status: subscriptionStatus, stripeSubscriptionId: event.data.object.id, stripeCustomerId: event.data.object.customer });
        }
    }
    console.log(`Handled event: ${event.type}, Customer Email: ${customerEmail}`);
}

WebApp.rawConnectHandlers.use((req, res) => {
    let data = [];
    req.on('data', (chunk) => {
        data.push(chunk);
    });

    req.on('end', Meteor.bindEnvironment(async () => {
        try {
            const rawBuffer = Buffer.concat(data);
            let event;
            try {
                const signature = req.headers['stripe-signature'];
                event = stripe.webhooks.constructEvent(rawBuffer, signature, STRIPE_ENDPOINT_SECRET);
            } catch (err) {
                console.error('Webhook signature verification failed:', err.message);
                return res.writeHead(400).end(`Webhook error: ${err.message}`);
            }

            // Handle the event
            switch (event.type) {
                case 'customer.subscription.created':
                    await handleSubscriptionEvent(event, 'pro');
                    break;
                case 'customer.subscription.deleted':
                    await handleSubscriptionEvent(event, 'free');
                    break;
                // Add more cases as needed
                case 'checkout.session.completed':
                    console.log('checkout.session.completed', event);
                    break;
                case 'customer.subscription.updated':
                    console.log('customer.subscription.updated', event);
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.writeHead(200).end('Received webhook.');
        } catch (err) {
            console.error('Error handling request:', err);
            res.writeHead(500).end('Internal Server Error');
        }
    }));
});
// console.log(STRIPE_ENDPOINT_SECRET, STRIPE_SECRET_KEY, STRIPE_RETURN_LINK, STRIPE_PAYMENT_LINK  )

Meteor.methods({
    getPaymentLink: async function () {
        // console.log('getPaymentLink', STRIPE_PAYMENT_LINK)
        return STRIPE_PAYMENT_LINK;
    },
    createStripePortalSession: async function () {
        const userId = this.userId;
        const user = await UserDataProvider.getProviderInstance().getUsersID(userId);

        if (!user) {
            throw new Meteor.Error('User not found');
        }

        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!customer) {
            throw new Meteor.Error('Customer not found');
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: STRIPE_RETURN_LINK,
        });
    

        return session.url;
    },
});