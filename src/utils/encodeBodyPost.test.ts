import { encodeBodyPost } from './encodeBodyPost';

describe('encodeBodyPost', () => {
  it('should take a json object and string containing values encoded in x-www-form-urlencoded content-type', () => {
    const jsonObject = {
      someValue: '&&oouuie$#(_   #$#',
      someOtherValue: 'asdfasdfagjfj kjfalsdjf',
    };
    const expected =
      'someValue=%26%26oouuie%24%23(_%20%20%20%23%24%23&someOtherValue=asdfasdfagjfj%20kjfalsdjf';

    expect(encodeBodyPost(jsonObject)).toEqual(expected);
  });
});
