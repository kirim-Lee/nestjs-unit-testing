import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { User } from './entities/user.entity';
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

type MockRepository<T> = Partial<Record<keyof T, jest.Mock>>;
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

  it('modules is all defined', () => {
    expect(userService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('createAccount');
  it.todo('login');
  it.todo('findById');
  it.todo('editProfile');
});
