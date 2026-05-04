#!/bin/bash
# setup.sh - Idempotent setup script for FaceMark-AI
# Run this script with sudo: sudo bash setup.sh

set -e

echo "Updating package lists..."
apt-get update -qq

# 1. Install Python 3 & pip if not present
if ! command -v python3 &> /dev/null || ! command -v pip3 &> /dev/null; then
    echo "Installing Python 3, pip, and venv..."
    apt-get install -y python3 python3-pip python3-venv
else
    echo "Python 3 and pip are already installed."
fi

# 2. Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    apt-get install -y postgresql postgresql-contrib
else
    echo "PostgreSQL is already installed."
fi

# Install pgvector for the current PostgreSQL version
PG_VERSION=$(psql -V | awk '{print $3}' | cut -d. -f1)
echo "Ensuring pgvector is installed for PostgreSQL $PG_VERSION..."
apt-get install -y postgresql-$PG_VERSION-pgvector

# 3. Install Node.js if not present
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js and npm are already installed."
fi

# 4. Set up PostgreSQL Database (idempotent)
echo "Ensuring PostgreSQL user and database exist..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='facemark'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER facemark WITH PASSWORD 'facemark123';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='facemark_db'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE facemark_db OWNER facemark;"
sudo -u postgres psql -d facemark_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 5. Set up Python Virtual Environment (idempotent)
if [ ! -d "venv" ]; then
    echo "Setting up Python virtual environment..."
    sudo -u $SUDO_USER python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

echo "Installing/Updating Python dependencies..."
sudo -u $SUDO_USER ./venv/bin/pip install -r requirements.txt

echo "========================================="
echo "All setup tasks complete! You can now activate the python environment with:"
echo "source venv/bin/activate"
echo "========================================="
