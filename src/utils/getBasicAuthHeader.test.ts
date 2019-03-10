import { getBasicAuthHeader } from './getBasicAuthHeader';

describe('getBasicAuthHeader', () => {
  it('should return a Basic auth header', () => {
    const client_id = 'totoMangeDesCrepes';
    const client_secret = 'aunutella';
    const expected = {
      Authorization: 'Basic dG90b01hbmdlRGVzQ3JlcGVzOmF1bnV0ZWxsYQ==',
    };
    expect(getBasicAuthHeader({ client_id, client_secret })).toEqual(expected);
  });
  it('should use empty string if no secret', () => {
    const client_id = 'totoMangeDesCrepesAuNutellaEtSenFout';
    const expected = {
      Authorization: 'Basic dG90b01hbmdlRGVzQ3JlcGVzQXVOdXRlbGxhRXRTZW5Gb3V0Og==',
    };
    expect(getBasicAuthHeader({ client_id })).toEqual(expected);
  });
});
