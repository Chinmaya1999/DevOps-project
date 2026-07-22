const checkSubscription = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const now = new Date();
    const subscription = user.subscription;

    // Check if user has any active subscription
    if (subscription.type === 'free') {
      return res.status(403).json({ 
        error: 'Premium subscription required',
        message: 'Please upgrade to premium to access this feature'
      });
    }

    // Check trial period
    if (subscription.type === 'trial') {
      if (subscription.trialEndDate && now > subscription.trialEndDate) {
        // Trial expired, check if they have paid subscription
        if (subscription.endDate && now <= subscription.endDate) {
          // Move to premium
          subscription.type = 'premium';
          user.save().catch(err => console.error('Error updating subscription:', err));
        } else {
          return res.status(403).json({ 
            error: 'Trial period expired',
            message: 'Your trial period has ended. Please subscribe to continue using premium features'
          });
        }
      }
    }

    // Check premium subscription expiry
    if (subscription.type === 'premium') {
      if (subscription.endDate && now > subscription.endDate) {
        subscription.type = 'free';
        user.save().catch(err => console.error('Error updating subscription:', err));
        return res.status(403).json({ 
          error: 'Subscription expired',
          message: 'Your subscription has expired. Please renew to continue using premium features'
        });
      }
    }

    // User has active subscription
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Error checking subscription status' });
  }
};

module.exports = { checkSubscription };
