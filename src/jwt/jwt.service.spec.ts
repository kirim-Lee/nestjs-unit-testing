import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

const TEST_KEY = 'testkey';
const TOKEN = 'token';
const ID = 1;

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => TOKEN),
  verify: jest.fn(() => ({ id: ID })),
}));

describe('JwtService', () => {
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: CONFIG_OPTIONS, useValue: { privateKey: TEST_KEY } },
      ],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
  });

  it('should define jwtService', () => {
    expect(jwtService).toBeDefined();
  });

  describe('jwt sign', () => {
    it('should return string', () => {
      const result = jwtService.sign(ID);

      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: ID }, TEST_KEY);
      expect(typeof result).toBe('string');
    });
  });

  describe('jwt verify', () => {
    it('should verify', () => {
      const result = jwtService.verify(TOKEN);

      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);
      expect(result).toEqual({ id: ID });
    });
  });
});
