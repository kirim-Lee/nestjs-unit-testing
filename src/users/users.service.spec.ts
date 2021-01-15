import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(() => 'token-string'),
  verify: jest.fn(),
};

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let userService: UsersService;
  let jwtService: JwtService;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('modules is all defined', () => {
    expect(userService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountInput = {
      email: 'ttt@ttt.com',
      password: '12345',
      role: UserRole.Host,
    };

    it('should success create account', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({ id: 1 });

      const result = await userService.createAccount(createAccountInput);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        email: createAccountInput.email,
      });

      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(createAccountInput);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith({ id: 1 });

      expect(result.ok).toBeTruthy();
      expect(result.error).toBeFalsy();
    });

    it('should not crete account if email is not unique', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1 });

      const result = await userService.createAccount(createAccountInput);

      expect(userRepository.create).not.toHaveBeenCalledTimes(1);
      expect(userRepository.save).not.toHaveBeenCalledTimes(1);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe('There is a user with that email already');
    });

    it('should return exception error if raise error', async () => {
      userRepository.findOne.mockImplementation(() => {
        throw Error();
      });

      const result = await userService.createAccount(createAccountInput);
      expect(userRepository.create).not.toHaveBeenCalledTimes(1);
      expect(userRepository.save).not.toHaveBeenCalledTimes(1);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe('Could not create account');
    });
  });

  it.todo('login');
  it.todo('findById');
  it.todo('editProfile');
});
