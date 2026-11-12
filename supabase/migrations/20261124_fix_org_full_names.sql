-- Correct the full names of OCTA and COESC in existing databases.
UPDATE public.organizations
SET name = 'Organization for Computing and Technology Advancements'
WHERE acronym = 'OCTA';

UPDATE public.organizations
SET name = 'College of Engineering Student Council'
WHERE acronym = 'COESC';

