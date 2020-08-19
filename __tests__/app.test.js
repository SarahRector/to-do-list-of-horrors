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
        email: 'sar@ah.com',
        password: '12345'
      });

    token = signInData.body.token;

    return done();
  
  });

  afterAll(done => {
    return client.end(done);
  });

  test('returns a new todo item when creating a new todo item', async(done) => {

    const data = await fakeRequest(app)
      .post('/api/monster_to_do')
      .send(newMonsterToDo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(newMonsterToDo);

    done();
  });