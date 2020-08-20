require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('routes', () => {
  let token;

  const newMonsterToDo = {
    id: 5,
    todo: 'scare people',
    completed: false,
  };

  beforeAll(async done => {
    execSync('npm run setup-db');

    client.connect();

    const signInData = await fakeRequest(app)
      .post('/auth/signup')
      .send({
        email: 'user1@user.com',
        password: '1234'
      });

    token = signInData.body.token;

    return done();
  
  });

  afterAll(done => {
    return client.end(done);
  });

  test('returns a new todo item when creating a new todo item', async(done) => {

    const testMonsterToDo = {
      ...newMonsterToDo,
      id: 4,
      owner_id: 2
    };

    const data = await fakeRequest(app)
      .post('/api/monster_to_do')
      .send(newMonsterToDo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(testMonsterToDo);

    done();

  });

  test('returns all todos for the user when hitting GET /monster_to_do', async(done) => {
    const expected = [
      {
        id: 4,
        todo: 'scare people',
        completed: false,
        owner_id: 2
      },
    ];

    const data = await fakeRequest(app)
      .get('/api/monster_to_do')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expected);

    done();
  });

  test('returns a single todo for the user when hitting GET /monster_to_do/:id', async(done) => {
    const expected = 
      {
        id: 4,
        todo: 'scare people',
        completed: false,
        owner_id: 2
      };

    const data = await fakeRequest(app)
      .get('/api/monster_to_do/4')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expected);

    done();
  });

  test('updates a single todo for the user when hitting PUT /monster_to_do/:id', async(done) => {
    const newToDo = {
      id: 4,
      todo: 'howl at the moon',
      completed: false,
      owner_id: 2
    };

    const expectedAllToDos = [{
      id: 4,
      todo: 'howl at the moon',
      completed: false,
      owner_id: 2
    }];

    const data = await fakeRequest(app)
      .put('/api/monster_to_do/4')
      .send(newToDo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    const allToDos = await fakeRequest(app)
      .get('/api/monster_to_do')
      .send(newToDo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(newToDo);
    expect(allToDos.body).toEqual(expectedAllToDos);

    done();
  });
});
