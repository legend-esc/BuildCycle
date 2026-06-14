import { Router } from 'express';
import { Keypair, Networks } from '@stellar/stellar-sdk';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();

// In-memory challenge store (Replace with Redis in production)
const challenges = new Map<string, string>();

router.get('/challenge', (req, res) => {
  const { publicKey } = req.query;
  if (!publicKey || typeof publicKey !== 'string') {
    return res.status(400).json({ error: 'publicKey is required' });
  }

  const challenge = crypto.randomBytes(32).toString('hex');
  challenges.set(publicKey, challenge);

  // Set timeout to expire challenge in 5 minutes
  setTimeout(() => challenges.delete(publicKey), 5 * 60 * 1000);

  res.json({ challenge });
});

router.post('/login', (req, res) => {
  const { publicKey, signature } = req.body;

  if (!publicKey || !signature) {
    return res.status(400).json({ error: 'publicKey and signature are required' });
  }

  const challenge = challenges.get(publicKey);
  if (!challenge) {
    return res.status(400).json({ error: 'Challenge expired or not found' });
  }

  try {
    const keypair = Keypair.fromPublicKey(publicKey);
    const isValid = keypair.verify(Buffer.from(challenge), Buffer.from(signature, 'base64'));

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    challenges.delete(publicKey);

    const token = jwt.sign(
      { publicKey },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
