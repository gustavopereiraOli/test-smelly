const { UserService } = require('../src/userService');

const buildUserData = (overrides = {}) => ({
  nome: 'Fulano de Tal',
  email: 'fulano@teste.com',
  idade: 25,
  ...overrides,
});

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  describe('createUser', () => {
    test('returns persisted user with generated id and default state', () => {
      const validInput = buildUserData();

      const createdUser = userService.createUser(
        validInput.nome,
        validInput.email,
        validInput.idade
      );

      expect(createdUser).toMatchObject({
        nome: validInput.nome,
        email: validInput.email,
        idade: validInput.idade,
        isAdmin: false,
        status: 'ativo',
      });
      expect(createdUser.id).toEqual(expect.any(String));
      expect(createdUser.createdAt).toBeInstanceOf(Date);
    });

    test('throws when user is under age', () => {
      const act = () => userService.createUser('Menor', 'menor@email.com', 17);

      expect(act).toThrow('O usuário deve ser maior de idade.');
    });
  });

  describe('getUserById', () => {
    test('returns the previously created user', () => {
      const validInput = buildUserData({ email: 'novo@teste.com' });
      const createdUser = userService.createUser(
        validInput.nome,
        validInput.email,
        validInput.idade
      );

      const foundUser = userService.getUserById(createdUser.id);

      expect(foundUser).toEqual(createdUser);
    });

    test('returns null when user does not exist', () => {
      const result = userService.getUserById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('deactivates non admin users', () => {
      const user = userService.createUser('Comum', 'comum@teste.com', 30);

      const result = userService.deactivateUser(user.id);
      const updatedUser = userService.getUserById(user.id);

      expect(result).toBe(true);
      expect(updatedUser.status).toBe('inativo');
    });

    test('does not deactivate admin users', () => {
      const admin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      const result = userService.deactivateUser(admin.id);
      const storedAdmin = userService.getUserById(admin.id);

      expect(result).toBe(false);
      expect(storedAdmin.status).toBe('ativo');
    });

    test('returns false when user is missing', () => {
      const result = userService.deactivateUser('unknown-id');

      expect(result).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('includes each active user in the report body', () => {
      const alice = userService.createUser('Alice', 'alice@email.com', 28);
      const bob = userService.createUser('Bob', 'bob@email.com', 32);

      const report = userService.generateUserReport();

      expect(report).toContain('--- Relatório de Usuários ---');
      expect(report).toContain(`Nome: ${alice.nome}`);
      expect(report).toContain(`Status: ${alice.status}`);
      expect(report).toContain(`Nome: ${bob.nome}`);
    });

    test('indicates empty state when database has no users', () => {
      const report = userService.generateUserReport();

      expect(report).toBe('--- Relatório de Usuários ---\nNenhum usuário cadastrado.');
    });
  });
});
