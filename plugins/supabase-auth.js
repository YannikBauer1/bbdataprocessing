import { supabase } from '~/utils/supabase';

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.client) {
    try {
      // Retrieve the session using the updated method
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error fetching session:', error.message);
      }

      if (!session) {
        // If no session, log in (replace with your preferred login method)
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'y4nm45@gmail.com', // Replace with dynamic or anonymous auth
          password: 'WebsiteRead123', // Or use secure keys or OTPs
        });

        if (loginError) {
          console.error('Login failed:', loginError.message);
        } else {
          console.log('User logged in');
        }
      } else {
        console.log('Session found, user is already logged in:', session.user);
      }
    } catch (err) {
      console.error('Error during login process:', err.message);
    }

    // Logout the user when the browser/tab is closed
    window.addEventListener('beforeunload', async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Logout failed:', error.message);
        } else {
          console.log('User logged out');
        }
      } catch (err) {
        console.error('Error during logout:', err.message);
      }
    });
  }

  // Optionally, listen to authentication state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      console.log('User session updated');
    } else {
      console.log('User logged out');
    }
  });
});

