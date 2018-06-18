# Bank On - San Francisco Map

This repository contains the artifacts for rendering a map of [banks recommended by the SF Office of Financial Empowerment](http://bankonsanfrancisco.com/map).

It's based on [@derekeder/FusionTable-Map-Template](https://github.com/derekeder/FusionTable-Map-Template), so it allows end-users to easily search by various filters.

This work was done as part of the nationwide [2013 Code Across America](http://brigade.codeforamerica.org/pages/codeacross) event.

![Screenshot](/screenshot.png)

## Run Locally

 Open `iframe.html` to see it in a window. Basic CSS is provided by Bootstrap.

## To update the data

1. Request access to the [fusion table](https://fusiontables.google.com/data?docid=1tXLoeP51Ej1i9XOFpiTPKYINPHOMBSII1JSW-Tmu).
1. Update individual rows, or wholesale update the table. Do not adjust the rows unless you want to majorly refactor the map.

## To modify filters

See the `custom filters` section of `maps_lib_v2.js`

# Contributors

- [Felix Sargent](https://github.com/fsargent)
- [Marc Chung](https://github.com/mchung)
- [Kristina Ng](https://github.com/ngkristina)
