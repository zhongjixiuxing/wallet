#!/bin/bash

npm run build && npx cap copy android && npx cap update android && npx cap copy ios && npx cap update ios && npx cap copy electron && npx cap update electron
