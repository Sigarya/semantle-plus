-- Create a table to store daily sample ranks
CREATE TABLE public.daily_sample_ranks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word_date DATE NOT NULL UNIQUE,
  rank_1_score NUMERIC NOT NULL,
  rank_990_score NUMERIC NOT NULL,
  rank_999_score NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_sample_ranks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anyone can read sample ranks)
CREATE POLICY "Anyone can view sample ranks" 
ON public.daily_sample_ranks 
FOR SELECT 
USING (true);

-- Only authenticated users can insert/update (for the system to add new data)
CREATE POLICY "System can insert sample ranks" 
ON public.daily_sample_ranks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update sample ranks" 
ON public.daily_sample_ranks 
FOR UPDATE 
USING (true);