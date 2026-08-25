import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const userDoc = await db.collection('users').doc(decoded.id).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        delete userData.password; // Do not send password downstream
        userData._id = userDoc.id;
        req.user = userData;
      }
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error('Token validation error:', error.message);
      res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
