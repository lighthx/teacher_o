CREATE EXTENSION vector;

CREATE TABLE crawl_words (
    word VARCHAR PRIMARY KEY,
    letter VARCHAR NOT NULL,
    page INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE  words_detail (
    word VARCHAR PRIMARY KEY,
    explain TEXT NOT NULL,
    examples JSONB NOT NULL,
    advance_learning JSONB NOT NULL,
    explain_embedding vector(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);