import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('user/home/home');
});

export default router;