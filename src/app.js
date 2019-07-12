const exphbs = require('express-handlebars');
const path = require('path');
const methodOverrie = require('method-override');
const express = require('express');
const promisifyAll = require('util-promisifyall');
const redis = require('redis');
const client = promisifyAll(redis.createClient());
const app = express();

client.on('connect', () => {
  console.log('connected to redis')
})

app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/views'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(methodOverrie('_method'));


app.get('/', (req,res) => {
  res.render('searchusers');
});
app.get('/user/add', (req,res) => {
  res.render('adduser');
});
app.post('/user/search', async (req,res) => {
  const id = req.body.id;
  const result = await client.hgetallAsync(id);
  if(!result) {
    res.render('searchusers', {
      error: 'User does not exist'
    });
  } else {
    result.id = id;
    res.render('details', {
      user: result
    })
  }
});
const getId = async () => {
  const result = await client.getAsync('userIdGen');
  if (!result) {
    await client.setAsync('userIdGen', 1000);
    return 1000
  } else {
    await client.incrAsync('userIdGen');
    return result
  }
}
app.post('/user/add', async (req,res) => {
  const id = await getId();
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const phone = req.body.phone;
  await client.hmsetAsync(id, [
    'firstName', firstName,
    'lastName', lastName,
    'email', email,
    'phone', phone
    ]);
  res.redirect('/');
});

app.delete('/user/delete/:id', async (req,res) => {
  await client.delAsync(req.params.id);
  res.redirect('/');
})
module.exports = app;
