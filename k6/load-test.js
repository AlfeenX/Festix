import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const bookingDuration = new Trend('booking_duration');

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '1m', target: 2000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';

export default function () {
  const eventsRes = http.get(`${BASE_URL}/events`);
  check(eventsRes, { 'events status 200': (r) => r.status === 200 });
  errorRate.add(eventsRes.status !== 200);

  if (eventsRes.status === 200) {
    const events = JSON.parse(eventsRes.body);
    if (events.length > 0) {
      const eventId = events[0].id;
      const seatsRes = http.get(`${BASE_URL}/events/${eventId}/seats`);
      check(seatsRes, { 'seats status 200': (r) => r.status === 200 });
      errorRate.add(seatsRes.status !== 200);
    }
  }

  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data.metrics, null, 2),
  };
}
