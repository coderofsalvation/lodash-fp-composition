#!/bin/bash 
grep '*' index.js | sed 's/\/\*/\#\#/g;s/ \* example:/> example:/g;s/ \* //g;s/\*\///g;s/\*//g'
