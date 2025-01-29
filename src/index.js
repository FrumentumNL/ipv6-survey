import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import {Reader} from '@maxmind/geoip2-node';
import Knex from 'knex';
import knexfile from '../knexfile.cjs';

const clientScript = fs.readFileSync(new URL('./client.js', import.meta.url), 'utf-8');
const asnDatabase = await Reader.open(new URL('../geo/GeoLite2-ASN.mmdb', import.meta.url));
const countryDatabase = await Reader.open(new URL('../geo/GeoLite2-Country.mmdb', import.meta.url));

const app = express();
const knex = Knex(knexfile);
const runningTests = new Map();

app.use(cors());
app.enable('trust proxy');

app.get('/client.js', (req, res) => {
    res.type('text/javascript');
    res.send(clientScript);
});

app.post('/test/:id/:type', async (req, res) => {
    res.type('text/plain');

    let {id, type} = req.params;
    if (id.length !== 8) {
        return res.status(400).send('Invalid test id');
    }
    if (!['ip4', 'ip6', 'dualstack'].includes(type)) {
        return res.status(400).send('Invalid test type');
    }

    let isIpv6 = true;
    let normalizedIp = req.ip;
    if (normalizedIp.includes('.')) {
        normalizedIp = normalizedIp.replace('::ffff:', '');
        isIpv6 = false;
    }
    if ((isIpv6 && type === 'ip4') || (!isIpv6 && type === 'ip6')) {
        return res.status(400).send('Invalid test - ip version mismatch');
    }

    let existingTest = runningTests.get(id);
    if (type === 'dualstack' && (!existingTest || (!existingTest.ip4 && !existingTest.ip6))) {
        return res.status(400).send('Invalid test - no ip4 or ip6 test result found');
    }
    if (!existingTest) {
        existingTest = {
            ip4: false,
            ip4ASN: null,
            ip4Country: null,
            ip6: false,
            ip6ASN: null,
            ip6Country: null,
            ip6Preferred: false
        };
        runningTests.set(id, existingTest);
        existingTest.timeout = setTimeout(() => {
            runningTests.delete(id);
        }, 30_000);
    }

    if (type === 'dualstack') {
        existingTest.ip6Preferred = isIpv6;
        runningTests.delete(id);
        clearTimeout(existingTest.timeout);

        let flags = 0;
        if (existingTest.ip4) flags |= 1;
        if (existingTest.ip6) flags |= 2;
        if (existingTest.ip6Preferred) flags |= 4;

        await knex('survey_results').insert({
            flags,
            ip4_asn: existingTest.ip4ASN,
            ip4_country: existingTest.ip4Country,
            ip6_asn: existingTest.ip6ASN,
            ip6_country: existingTest.ip6Country,
            created_at: new Date()
        });

        return res.send(existingTest);
    }

    let asn = null, country = null;
    try {
        asn = asnDatabase.asn(normalizedIp);
    } catch (ignored) {
    }
    try {
        country = countryDatabase.country(normalizedIp);
    } catch (ignored) {
    }

    if (isIpv6) {
        existingTest.ip6 = true;
        existingTest.ip6ASN = asn?.autonomousSystemNumber || null;
        existingTest.ip6Country = country?.country.isoCode || null;
    } else {
        existingTest.ip4 = true;
        existingTest.ip4ASN = asn?.autonomousSystemNumber || null;
        existingTest.ip4Country = country?.country.isoCode || null;
    }

    res.send('ok');
});

const httpPort = process.env.HTTP_PORT || 3000;
app.listen(httpPort, '127.0.0.1', () => {
    console.log(`Server is running on 127.0.0.1:${httpPort}`);
});
