import { invalid } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { Subscriber } from '$lib/newsletter/client';
import { getClient } from '$lib/newsletter/client';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const newsletter = getClient(fetch);

		const data = await request.formData();
		const headers = request.headers;
		const email = data.get('email');

		if (!email) {
			return invalid(400, { message: 'email is required' });
		}

		// include IP address and IP country from Cloudflare headers if available:
		// https://developers.cloudflare.com/fundamentals/get-started/reference/http-request-headers
		const subscriber = {
			email,
			ip_address: headers.get('CF-Connecting-IP'),
			fields: {
				country: headers.get('CF-IPCountry')
			}
		} as Subscriber;

		const resp = await newsletter.subscribe(subscriber);

		if (!resp.ok) {
			return invalid(resp.status, resp.payload);
		}

		return { success: true };
	}
};
