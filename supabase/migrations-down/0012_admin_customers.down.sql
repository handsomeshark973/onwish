drop function if exists admin_customer_list(text, text, boolean, int, text, text, int, int);
drop function if exists admin_customer_compare(int);
drop function if exists admin_customer_trend(int);
drop function if exists admin_customer_summary();
drop index if exists customer_profiles_segment;
drop index if exists customer_profiles_guest;
drop function if exists customer_segment(text, boolean);
