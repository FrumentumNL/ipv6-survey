#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 ACCOUNT_ID API_KEY"
    exit 1
fi
ACCOUNT_ID=$1
API_KEY=$2

mkdir -p geo/
wget --content-disposition --user=$ACCOUNT_ID --password=$API_KEY https://download.maxmind.com/geoip/databases/GeoLite2-ASN/download?suffix=tar.gz -O geo/GeoLite2-ASN.tar.gz
wget --content-disposition --user=$ACCOUNT_ID --password=$API_KEY https://download.maxmind.com/geoip/databases/GeoLite2-Country/download?suffix=tar.gz -O geo/GeoLite2-Country.tar.gz
tar -xvzf geo/GeoLite2-ASN.tar.gz -C geo/
tar -xvzf geo/GeoLite2-Country.tar.gz -C geo/
mv geo/GeoLite2-*/GeoLite2-*.mmdb geo/
rm -r geo/GeoLite2-*.tar.gz geo/GeoLite2-*/
