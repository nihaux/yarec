import { getBasicAuthHeader } from './getBasicAuthHeader';

describe('getBasicAuthHeader', () => {
  it('should return a Basic auth header', () => {
    const clientId = 'totoMangeDesCrepes';
    const clientSecret = 'aunutella';
    const expected = {
      Authorization: 'Basic dG90b01hbmdlRGVzQ3JlcGVzOmF1bnV0ZWxsYQ==',
    };
    expect(getBasicAuthHeader({ clientId, clientSecret })).toEqual(expected);
  });
  it('should use empty string if no secret', () => {
    const clientId = 'totoMangeDesCrepesAuNutellaEtSenFout';
    const expected = {
      Authorization: 'Basic dG90b01hbmdlRGVzQ3JlcGVzQXVOdXRlbGxhRXRTZW5Gb3V0Og==',
    };
    expect(getBasicAuthHeader({ clientId })).toEqual(expected);
  });
});
