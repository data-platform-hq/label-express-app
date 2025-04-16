## Getting Started

First, run the development server:

```bash
nvm use --lts

yarn dev

```
## App server
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## OS with NO security
```docker run -d -p 9200:9200 -p 9600:9600 -e "discovery.type=single-node" -e "DISABLE_INSTALL_DEMO_CONFIG=true" -e "DISABLE_SECURITY_PLUGIN=true"  -e "OPENSEARCH_INITIAL_ADMIN_PASSWORD=Alexi@5we%6" opensearchproject/opensearch:latest```

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


Default user
name: 'Admin User',
email: 'admin@example.com',
password: 'admin123',


app
 ┣ admin
 ┃ ┣ users
 ┃ ┃ ┗ page.tsx
 ┃ ┗ layout.tsx
 ┣ api
 ┃ ┣ admin
 ┃ ┃ ┗ users
 ┃ ┃ ┃ ┣ [id]
 ┃ ┃ ┃ ┃ ┗ route.ts
 ┃ ┃ ┃ ┗ route.ts
 ┃ ┗ auth
 ┃ ┃ ┣ [...nextauth]
 ┃ ┃ ┃ ┗ route.ts
 ┃ ┃ ┗ register
 ┃ ┃ ┃ ┗ route.ts
 ┣ auth
 ┃ ┗ signin
 ┃ ┃ ┗ page.tsx
 ┣ components
 ┃ ┣ Annotations
 ┃ ┃ ┣ AnnotationForm.tsx
 ┃ ┃ ┣ AnnotationPopup.tsx
 ┃ ┃ ┣ AnnotationSidebar.tsx
 ┃ ┃ ┗ annotationOptions.ts
 ┃ ┣ Auth
 ┃ ┃ ┗ UserMenu.tsx
 ┃ ┣ Chart
 ┃ ┃ ┣ BrushModeSelector.tsx
 ┃ ┃ ┣ ChartBrush.tsx
 ┃ ┃ ┣ ChartTooltip.tsx
 ┃ ┃ ┣ ChartTooltipHandler.tsx
 ┃ ┃ ┣ ChartView.tsx
 ┃ ┃ ┣ DataProcessor.tsx
 ┃ ┃ ┣ ScrollableLegend.tsx
 ┃ ┃ ┣ TimeSeriesChart.tsx
 ┃ ┃ ┣ chartUtils.ts
 ┃ ┃ ┗ useBrushInteraction.tsx
 ┃ ┣ FieldsSelector
 ┃ ┃ ┣ AggregationForm.tsx
 ┃ ┃ ┣ DateRangePicker.tsx
 ┃ ┃ ┣ FieldDropdown.tsx
 ┃ ┃ ┣ FieldSelector.tsx
 ┃ ┃ ┣ FilterValueSelector.tsx
 ┃ ┃ ┣ IndexSelector.tsx
 ┃ ┃ ┣ IntervalSelector.tsx
 ┃ ┃ ┣ ResultsDisplay.tsx
 ┃ ┃ ┗ intervalUtils.ts
 ┃ ┣ Views
 ┃ ┃ ┣ AggregationResults.tsx
 ┃ ┃ ┣ AnnotationDetails.tsx
 ┃ ┃ ┣ ResultsView.tsx
 ┃ ┃ ┣ ViewControls.tsx
 ┃ ┃ ┗ VisualizationLayout.tsx
 ┃ ┣ Portal.tsx
 ┃ ┗ types.ts
 ┣ contexts
 ┃ ┣ AuthContext.tsx
 ┃ ┗ FormStateContext.tsx
 ┣ hooks
 ┃ ┣ useAggregationData.ts
 ┃ ┣ useAnnotations.tsx
 ┃ ┣ useFieldSelectorState.ts
 ┃ ┣ useFieldsLoader.ts
 ┃ ┗ useFilterValuesLoader.ts
 ┣ types
 ┃ ┗ next-auth.d.ts
 ┣ unauthorized
 ┃ ┗ page.tsx
 ┣ utils
 ┃ ┗ actions.ts
 ┣ .DS_Store
 ┣ favicon.ico
 ┣ globals.css
 ┣ layout.tsx
 ┗ page.tsx
lib
 ┣ auth.ts
 ┗ opensearch.ts
 