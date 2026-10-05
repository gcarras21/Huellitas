import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

print("--- SECURITY TEST ---")

try:
    print("Test 1: Public read on dogs table...")
    res = supabase.table("dogs").select("*").limit(1).execute()
    print(f"Success! Fetched {len(res.data)} dog(s).")
except Exception as e:
    print(f"Failed: {e}")

try:
    print("\nTest 2: Unauthorized insert on dogs table...")
    res = supabase.table("dogs").insert({"name": "HackerDog"}).execute()
    print("WARNING: Insert succeeded! Security is broken.")
except Exception as e:
    print("Success! Insert was blocked by RLS.")

try:
    print("\nTest 3: Unauthorized read on medical_records...")
    res = supabase.table("medical_records").select("*").execute()
    if len(res.data) == 0:
        print("Success! RLS returned 0 rows (Access Denied).")
    else:
        print(f"WARNING: Read {len(res.data)} rows! Security is broken.")
except Exception as e:
    print(f"Success! Read was blocked by RLS. {e}")
