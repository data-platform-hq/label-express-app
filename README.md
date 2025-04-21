## Getting Started

Development server:

```bash
nvm use --lts

yarn dev

```
## App server
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## OS with Security

``` docker run -d --name opensearch_secure -p 9200:9200 -p 9600:9600 -e "discovery.type=single-node" -e "OPENSEARCH_INITIAL_ADMIN_PASSWORD=password"  opensearchproject/opensearch:latest ```

## Postgres
```docker run --name postgres -e POSTGRES_PASSWORD=mysecretpassword -v postgres_data:/var/lib/postgresql/data -p 5432:5432 -d postgres```





## Generate data
Use ```python_scripts/esp with issues and annotations.py``` to generate data


### Test dataset in opensearch:

* Gas locking: Will occur approximately once every 2 weeks per pump
* Gas interference: Will occur approximately once per week per pump
* Sanding: Will occur approximately once per month per pump
* Shutdown: Will occur approximately once every 4-5 months per pump
* This should result in a much more realistic frequency of issues, with:

More common minor issues (gas interference)
Less common moderate issues (gas locking, sanding)
Very rare major issues (shutdowns)
For a 6-month dataset with 5 pumps, you should see roughly:

~30 gas interference events (6 per pump)
~15 gas locking events (3 per pump)
~5-6 sanding events (1-2 per pump)
~1-2 shutdown events (across all pumps)

## Next-auth default user

Default user
name: 'Admin User',
email: 'admin@example.com',
password: 'admin123',
role: 'admin'

## Prisma setup


``` 
# Generate Prisma client based on your updated schema
npx prisma generate


# Create the database and tables
npx prisma db push

# Seed users
yarn seed

```


## Build & Deploy

```
#Build Your Application
yarn build

#Start the Production Server
yarn start

```

### Docker

```
#Docker
docker build -t label-express-app .
docker run -p 3000:3000 -v $(pwd)/data:/app/data label-express-app

```