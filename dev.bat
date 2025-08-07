@echo off
REM The Sus Fit - Development Server Script for Windows
REM This script checks for required environment variables and starts the development server

echo Starting The Sus Fit development server...

REM Check if OPENAI_API_KEY is set
if "%OPENAI_API_KEY%"=="" (
    echo ERROR: OPENAI_API_KEY environment variable is not set
    echo.
    echo Please set your OpenAI API key using one of these methods:
    echo.
    echo Method 1 - Set environment variable:
    echo   set OPENAI_API_KEY=sk-proj-your-key-here
    echo.
    echo Method 2 - Create .env.local file:
    echo   copy .env.example .env.local
    echo   REM Then edit .env.local with your API key
    echo.
    echo Get your API key from: https://platform.openai.com/api-keys
    echo.
    exit /b 1
)

REM Check if the API key looks valid (basic format check)
echo %OPENAI_API_KEY% | findstr /r "^sk-proj-" >nul
if errorlevel 1 (
    echo WARNING: OPENAI_API_KEY format appears invalid
    echo Expected format: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    echo.
)

echo Environment check passed. Starting development server...
echo.

REM Start the development server using pnpm
call pnpm run dev

REM Check if the command was successful
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start development server
    echo Please check your installation and try again
    exit /b 1
)
