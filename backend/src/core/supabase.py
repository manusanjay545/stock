from supabase import create_client, Client
from .config import settings

# Initialize the Supabase client
# We use the Service Role Key here because the backend needs to bypass RLS to check 
# and update subscriptions for users safely from trusted code.
# The frontend uses the ANON key, but the backend is a trusted environment.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
