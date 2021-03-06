const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/monster_to_do', async(req, res) => {
  const userId = req.userId;
  const data = await client.query(`
    SELECT * FROM monster_to_do
      WHERE monster_to_do.owner_id=${userId}
      `);

  res.json(data.rows);
});

app.get('/api/monster_to_do/:id', async(req, res) => {
  const todoId = req.params.id;
  const userId = req.userId;
  const data = await client.query(`
    SELECT * FROM  monster_to_do
    WHERE monster_to_do.id=$1 AND monster_to_do.owner_id=$2;
    `, [todoId, userId]);

  res.json(data.rows[0]);
});

app.put('/api/monster_to_do/:id', async(req, res) => {
  const monsterToDoId = req.params.id;

  try {
    const updatedMonsterToDo = {
      todo: req.body.todo,
      completed: req.body.completed,
    };

    const data = await client.query(`
      UPDATE monster_to_do
        SET todo=$1, completed=$2
        WHERE monster_to_do.id = $3
        RETURNING *
    `, [updatedMonsterToDo.todo, updatedMonsterToDo.completed, monsterToDoId]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/monster_to_do', async(req, res) => {
  try {
    const newMonsterToDo = {
      todo: req.body.todo,
      completed: req.body.completed,
      user_id: 1
    };

    const data = await client.query(`
    INSERT INTO monster_to_do(todo, completed, owner_id)
    VALUES($1, $2, $3)
    RETURNING *
  `, [newMonsterToDo.todo, newMonsterToDo.completed, req.userId]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});


app.use(require('./middleware/error'));

module.exports = app;
