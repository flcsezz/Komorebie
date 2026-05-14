CREATE OR REPLACE FUNCTION spend_mana(amount INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_mana INT;
BEGIN
  SELECT mana_points INTO current_mana FROM profiles WHERE id = auth.uid();
  IF current_mana >= amount THEN
    UPDATE profiles SET mana_points = mana_points - amount WHERE id = auth.uid();
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;
