## Getting Started

First, run the development server:

```bash
nvm use --lts

yarn dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


Test dataset in opensearch:

Gas locking: Will occur approximately once every 2 weeks per pump
Gas interference: Will occur approximately once per week per pump
Sanding: Will occur approximately once per month per pump
Shutdown: Will occur approximately once every 4-5 months per pump
This should result in a much more realistic frequency of issues, with:

More common minor issues (gas interference)
Less common moderate issues (gas locking, sanding)
Very rare major issues (shutdowns)
For a 6-month dataset with 5 pumps, you should see roughly:

~30 gas interference events (6 per pump)
~15 gas locking events (3 per pump)
~5-6 sanding events (1-2 per pump)
~1-2 shutdown events (across all pumps)


Default
name: 'Admin User',
email: 'admin@example.com',
password: 'admin123',
