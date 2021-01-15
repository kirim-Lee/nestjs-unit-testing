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
  findOneOrFail: jest.fn(),
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

  describe('login', () => {
    const loginInput = {
      email: 'ttt@ttt.com',
      password: '123',
    };

    it('should success login when correct value', async () => {
      const mockUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.login(loginInput);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(
        { email: loginInput.email },
        expect.any(Object),
      );

      expect(mockUser.checkPassword).toHaveBeenCalledTimes(1);
      expect(mockUser.checkPassword).toHaveBeenCalledWith(loginInput.password);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(1);

      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.token).toEqual(expect.any(String));
    });

    it('should return error if user is not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await userService.login(loginInput);

      expect(jwtService.sign).not.toHaveBeenCalledTimes(1);

      expect(result.ok).toBeFalsy();
      expect(result.token).toBeUndefined();
      expect(result.error).toBe('User not found');
    });

    it('should return error if password is not correct', async () => {
      const mockUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.login(loginInput);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(
        { email: loginInput.email },
        expect.any(Object),
      );

      expect(mockUser.checkPassword).toHaveBeenCalledTimes(1);
      expect(mockUser.checkPassword).toHaveBeenCalledWith(loginInput.password);

      expect(jwtService.sign).not.toHaveBeenCalledTimes(1);

      expect(result.ok).toBeFalsy();
      expect(result.token).toBeUndefined();
      expect(result.error).toBe('Wrong password');
    });

    it('should return exception error if raise error', async () => {
      userRepository.findOne.mockImplementation(() => {
        throw Error('exception error');
      });

      const result = await userService.login(loginInput);

      expect(result.ok).toBeFalsy();
      expect(result.error).toEqual(Error('exception error'));
    });
  });

  describe('findById', () => {
    it('should return user', async () => {
      const returnUser = { id: 1, email: 'some@some.com' };
      userRepository.findOneOrFail.mockResolvedValue(returnUser);

      const result = await userService.findById(1);

      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith({ id: 1 });

      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.user).toEqual(returnUser);
    });

    it('should return null user', async () => {
      userRepository.findOneOrFail.mockResolvedValue(null);

      const result = await userService.findById(1);

      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.user).toEqual(null);
    });

    it('should return exception error if raise error', async () => {
      userRepository.findOneOrFail.mockRejectedValue('any');

      const result = await userService.findById(1);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe('User Not Found');
    });
  });

  describe('editProfile', () => {
    const updateProfile = {
      email: 'update@com.com',
      password: '12345',
    };
    it('should update user', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1 });
      const result = await userService.editProfile(1, updateProfile);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(1);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...updateProfile,
        id: 1,
      });

      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('should update not email nor not password', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1 });
      const result = await userService.editProfile(1, {});

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(1);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith({ id: 1 });

      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('should error user not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await userService.editProfile(1, updateProfile);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe('Could not update profile');
    });
  });
});
