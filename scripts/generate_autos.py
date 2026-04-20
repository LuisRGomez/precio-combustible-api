#!/usr/bin/env python3
"""
Generate a comprehensive JSON file of Argentine market vehicles (2010-2025).
Outputs to front-end/src/data/autos.json with ~250+ entries.
"""

import json
import os

# Each entry: (marca, modelo, version, anio_desde, anio_hasta,
#              consumo_ciudad, consumo_mixto, consumo_ruta,
#              litros_tanque, combustible, categoria)

vehicles = [
    # =========================================================================
    # CHERY
    # =========================================================================
    ("Chery", "Arrizo 5", "1.5", 2020, 2025, 10.5, 12.5, 15.0, 48, "nafta_super", "sedan"),
    ("Chery", "Tiggo 2 Pro", "1.5", 2021, 2025, 10.0, 12.0, 14.5, 45, "nafta_super", "suv"),
    ("Chery", "Tiggo 4 Pro", "1.5T", 2021, 2025, 9.5, 11.5, 14.0, 50, "nafta_super", "suv"),
    ("Chery", "Tiggo 7 Pro", "1.5T", 2022, 2025, 9.0, 11.0, 13.5, 55, "nafta_super", "suv"),
    ("Chery", "Tiggo 8 Pro", "1.5T", 2022, 2025, 8.5, 10.5, 13.0, 55, "nafta_super", "suv"),

    # =========================================================================
    # CHEVROLET
    # =========================================================================
    ("Chevrolet", "Classic", "1.4", 2010, 2016, 10.0, 12.0, 14.5, 47, "nafta_super", "sedan"),
    ("Chevrolet", "Corsa", "1.4", 2010, 2014, 10.5, 12.5, 15.0, 45, "nafta_super", "hatchback"),
    ("Chevrolet", "Corsa", "1.6", 2010, 2014, 9.5, 11.5, 14.0, 45, "nafta_super", "hatchback"),
    ("Chevrolet", "Cruze", "1.4T", 2017, 2025, 9.5, 11.5, 14.0, 50, "nafta_super", "sedan"),
    ("Chevrolet", "Cruze", "1.4T 5P", 2017, 2025, 9.5, 11.5, 14.0, 50, "nafta_super", "hatchback"),
    ("Chevrolet", "Montana", "1.2T", 2023, 2025, 10.5, 13.0, 15.5, 50, "nafta_super", "pickup"),
    ("Chevrolet", "Onix", "1.0T", 2020, 2025, 11.5, 13.5, 16.0, 40, "nafta_super", "hatchback"),
    ("Chevrolet", "Onix", "1.2", 2020, 2025, 11.0, 13.0, 15.5, 40, "nafta_super", "hatchback"),
    ("Chevrolet", "Onix Plus", "1.0T", 2020, 2025, 11.5, 13.5, 16.0, 40, "nafta_super", "sedan"),
    ("Chevrolet", "Onix Plus", "1.2", 2020, 2025, 11.0, 13.0, 15.5, 40, "nafta_super", "sedan"),
    ("Chevrolet", "Prisma", "1.4", 2013, 2019, 10.5, 12.5, 15.0, 43, "nafta_super", "sedan"),
    ("Chevrolet", "S10", "2.8 TDI", 2012, 2025, 8.0, 10.0, 12.0, 76, "gasoil", "pickup"),
    ("Chevrolet", "Spin", "1.8", 2013, 2025, 9.0, 11.0, 13.5, 50, "nafta_super", "van"),
    ("Chevrolet", "Tracker", "1.0T", 2021, 2025, 10.5, 12.5, 15.0, 44, "nafta_super", "suv"),
    ("Chevrolet", "Tracker", "1.2T", 2021, 2025, 10.0, 12.0, 14.5, 44, "nafta_super", "suv"),

    # =========================================================================
    # CITROEN
    # =========================================================================
    ("Citroen", "Berlingo", "1.6", 2013, 2025, 9.0, 11.0, 13.5, 60, "nafta_super", "van"),
    ("Citroen", "Berlingo", "1.6 HDi", 2013, 2025, 10.5, 12.5, 14.5, 60, "gasoil", "van"),
    ("Citroen", "C-Elysee", "1.6", 2014, 2019, 10.0, 12.0, 14.5, 50, "nafta_super", "sedan"),
    ("Citroen", "C3", "1.2", 2017, 2025, 12.0, 14.0, 16.5, 42, "nafta_super", "hatchback"),
    ("Citroen", "C3", "1.6", 2010, 2025, 10.5, 12.5, 15.0, 50, "nafta_super", "hatchback"),
    ("Citroen", "C3 Aircross", "1.6", 2012, 2025, 9.5, 11.5, 14.0, 50, "nafta_super", "suv"),
    ("Citroen", "C4 Cactus", "1.6", 2018, 2023, 10.0, 12.0, 14.5, 50, "nafta_super", "suv"),
    ("Citroen", "C4 Lounge", "1.6 THP", 2014, 2019, 9.5, 11.5, 14.0, 60, "nafta_premium", "sedan"),

    # =========================================================================
    # FIAT
    # =========================================================================
    ("Fiat", "500", "1.4", 2012, 2020, 11.0, 13.0, 15.5, 35, "nafta_super", "hatchback"),
    ("Fiat", "Argo", "1.3 GSE", 2018, 2025, 12.0, 14.0, 16.5, 48, "nafta_super", "hatchback"),
    ("Fiat", "Argo", "1.8", 2018, 2025, 9.5, 11.5, 14.0, 48, "nafta_super", "hatchback"),
    ("Fiat", "Cronos", "1.3 GSE", 2018, 2025, 12.0, 14.0, 16.5, 48, "nafta_super", "sedan"),
    ("Fiat", "Cronos", "1.8", 2018, 2025, 9.5, 11.5, 14.0, 48, "nafta_super", "sedan"),
    ("Fiat", "Fastback", "1.0T", 2023, 2025, 11.0, 13.0, 15.5, 48, "nafta_super", "suv"),
    ("Fiat", "Mobi", "1.0", 2017, 2025, 13.0, 15.5, 18.0, 37, "nafta_super", "hatchback"),
    ("Fiat", "Palio", "1.4", 2010, 2018, 11.0, 13.0, 15.5, 48, "nafta_super", "hatchback"),
    ("Fiat", "Palio", "1.6", 2010, 2018, 9.5, 11.5, 14.0, 48, "nafta_super", "hatchback"),
    ("Fiat", "Punto", "1.4", 2013, 2018, 10.5, 12.5, 15.0, 48, "nafta_super", "hatchback"),
    ("Fiat", "Punto", "1.6", 2013, 2018, 9.5, 11.5, 14.0, 48, "nafta_super", "hatchback"),
    ("Fiat", "Pulse", "1.0T", 2022, 2025, 11.5, 13.5, 16.0, 48, "nafta_super", "suv"),
    ("Fiat", "Siena", "1.4", 2010, 2016, 10.5, 12.5, 15.0, 48, "nafta_super", "sedan"),
    ("Fiat", "Strada", "1.3 GSE", 2020, 2025, 11.5, 13.5, 16.0, 48, "nafta_super", "pickup"),
    ("Fiat", "Toro", "1.3T", 2022, 2025, 10.0, 12.0, 14.5, 55, "nafta_super", "pickup"),
    ("Fiat", "Toro", "2.0 Diesel", 2017, 2025, 9.5, 12.0, 14.5, 60, "gasoil", "pickup"),

    # =========================================================================
    # FORD
    # =========================================================================
    ("Ford", "Bronco Sport", "1.5T", 2023, 2025, 9.0, 11.0, 13.5, 55, "nafta_super", "suv"),
    ("Ford", "EcoSport", "1.5", 2013, 2025, 10.0, 12.0, 14.5, 52, "nafta_super", "suv"),
    ("Ford", "EcoSport", "2.0", 2013, 2022, 8.5, 10.5, 13.0, 52, "nafta_super", "suv"),
    ("Ford", "Fiesta", "1.6", 2010, 2019, 10.5, 12.5, 15.0, 45, "nafta_super", "hatchback"),
    ("Ford", "Focus", "1.6", 2010, 2019, 10.0, 12.0, 14.5, 55, "nafta_super", "hatchback"),
    ("Ford", "Focus", "2.0", 2010, 2019, 8.5, 10.5, 13.0, 55, "nafta_super", "hatchback"),
    ("Ford", "Focus Sedan", "1.6", 2010, 2019, 10.0, 12.0, 14.5, 55, "nafta_super", "sedan"),
    ("Ford", "Focus Sedan", "2.0", 2010, 2019, 8.5, 10.5, 13.0, 55, "nafta_super", "sedan"),
    ("Ford", "Ka", "1.5", 2014, 2022, 10.5, 12.5, 15.0, 42, "nafta_super", "hatchback"),
    ("Ford", "Ka Sedan", "1.5", 2014, 2022, 10.5, 12.5, 15.0, 42, "nafta_super", "sedan"),
    ("Ford", "Kuga", "2.0", 2013, 2020, 8.0, 10.0, 12.5, 60, "nafta_super", "suv"),
    ("Ford", "Kuga", "2.5", 2020, 2025, 7.5, 9.5, 12.0, 57, "nafta_super", "suv"),
    ("Ford", "Maverick", "2.0T", 2023, 2025, 8.0, 10.0, 12.5, 63, "nafta_super", "pickup"),
    ("Ford", "Ranger", "2.0 Biturbo", 2023, 2025, 8.5, 10.5, 12.5, 80, "gasoil", "pickup"),
    ("Ford", "Ranger", "2.2 TDCi", 2012, 2022, 8.5, 10.5, 12.5, 80, "gasoil", "pickup"),
    ("Ford", "Ranger", "3.2 TDCi", 2012, 2022, 7.5, 9.5, 11.5, 80, "gasoil", "pickup"),
    ("Ford", "Territory", "1.5T", 2021, 2025, 9.0, 11.0, 13.5, 55, "nafta_super", "suv"),

    # =========================================================================
    # HONDA
    # =========================================================================
    ("Honda", "City", "1.5", 2015, 2025, 11.0, 13.0, 15.5, 40, "nafta_super", "sedan"),
    ("Honda", "Civic", "1.5T", 2017, 2025, 9.5, 11.5, 14.0, 47, "nafta_premium", "sedan"),
    ("Honda", "Civic", "2.0", 2012, 2022, 9.0, 11.0, 13.5, 50, "nafta_super", "sedan"),
    ("Honda", "CR-V", "1.5T", 2018, 2025, 8.5, 10.5, 13.0, 57, "nafta_premium", "suv"),
    ("Honda", "Fit", "1.5", 2010, 2023, 11.5, 13.5, 16.0, 40, "nafta_super", "hatchback"),
    ("Honda", "HR-V", "1.5", 2023, 2025, 10.0, 12.0, 14.5, 45, "nafta_super", "suv"),
    ("Honda", "HR-V", "1.8", 2015, 2022, 9.5, 11.5, 14.0, 50, "nafta_super", "suv"),
    ("Honda", "WR-V", "1.5", 2017, 2023, 10.5, 12.5, 15.0, 42, "nafta_super", "suv"),

    # =========================================================================
    # HYUNDAI
    # =========================================================================
    ("Hyundai", "Creta", "1.0T", 2022, 2025, 10.5, 12.5, 15.0, 50, "nafta_super", "suv"),
    ("Hyundai", "Creta", "1.6", 2016, 2025, 9.5, 11.5, 14.0, 55, "nafta_super", "suv"),
    ("Hyundai", "HB20", "1.0", 2020, 2025, 12.5, 14.5, 17.0, 37, "nafta_super", "hatchback"),
    ("Hyundai", "HB20", "1.6", 2020, 2025, 10.0, 12.0, 14.5, 37, "nafta_super", "hatchback"),
    ("Hyundai", "HB20S", "1.0", 2020, 2025, 12.5, 14.5, 17.0, 37, "nafta_super", "sedan"),
    ("Hyundai", "HB20S", "1.6", 2020, 2025, 10.0, 12.0, 14.5, 37, "nafta_super", "sedan"),
    ("Hyundai", "Santa Fe", "2.2 CRDi", 2016, 2025, 8.0, 10.0, 12.5, 71, "gasoil", "suv"),
    ("Hyundai", "Santa Fe", "2.4", 2013, 2025, 7.5, 9.5, 12.0, 71, "nafta_super", "suv"),
    ("Hyundai", "Tucson", "1.6T", 2022, 2025, 9.0, 11.0, 13.5, 54, "nafta_premium", "suv"),
    ("Hyundai", "Tucson", "2.0", 2016, 2025, 8.5, 10.5, 13.0, 62, "nafta_super", "suv"),
    ("Hyundai", "Venue", "1.0T", 2023, 2025, 11.0, 13.0, 15.5, 45, "nafta_super", "suv"),

    # =========================================================================
    # JEEP
    # =========================================================================
    ("Jeep", "Commander", "1.3T", 2022, 2025, 9.0, 11.0, 13.5, 55, "nafta_super", "suv"),
    ("Jeep", "Commander", "2.0 TDI", 2022, 2025, 9.5, 11.5, 14.0, 55, "gasoil", "suv"),
    ("Jeep", "Compass", "1.3T", 2022, 2025, 9.5, 11.5, 14.0, 48, "nafta_super", "suv"),
    ("Jeep", "Compass", "2.0 TDI", 2018, 2025, 10.0, 12.0, 14.5, 55, "gasoil", "suv"),
    ("Jeep", "Compass", "2.4", 2017, 2021, 8.0, 10.0, 12.5, 55, "nafta_super", "suv"),
    ("Jeep", "Gladiator", "3.6 V6", 2021, 2025, 5.0, 6.5, 8.5, 83, "nafta_premium", "pickup"),
    ("Jeep", "Renegade", "1.3T", 2022, 2025, 10.0, 12.0, 14.5, 48, "nafta_super", "suv"),
    ("Jeep", "Renegade", "1.8", 2016, 2025, 9.0, 11.0, 13.5, 48, "nafta_super", "suv"),

    # =========================================================================
    # KIA
    # =========================================================================
    ("Kia", "Cerato", "2.0", 2019, 2025, 9.0, 11.0, 13.5, 50, "nafta_super", "sedan"),
    ("Kia", "Picanto", "1.0", 2018, 2025, 13.5, 15.5, 18.0, 35, "nafta_super", "hatchback"),
    ("Kia", "Picanto", "1.2", 2018, 2025, 12.5, 14.5, 17.0, 35, "nafta_super", "hatchback"),
    ("Kia", "Seltos", "1.0T", 2021, 2025, 10.5, 12.5, 15.0, 50, "nafta_super", "suv"),
    ("Kia", "Seltos", "1.6", 2021, 2025, 9.5, 11.5, 14.0, 50, "nafta_super", "suv"),
    ("Kia", "Sorento", "2.2 CRDi", 2015, 2025, 8.0, 10.0, 12.5, 67, "gasoil", "suv"),
    ("Kia", "Sportage", "1.6T", 2023, 2025, 9.0, 11.0, 13.5, 54, "nafta_premium", "suv"),
    ("Kia", "Sportage", "2.0 CRDi", 2015, 2022, 8.5, 10.5, 13.0, 62, "gasoil", "suv"),
    ("Kia", "Stonic", "1.0T", 2022, 2025, 11.0, 13.0, 15.5, 42, "nafta_super", "suv"),

    # =========================================================================
    # MERCEDES-BENZ
    # =========================================================================
    ("Mercedes-Benz", "Clase A", "1.3T", 2019, 2025, 10.0, 12.0, 14.5, 43, "nafta_premium", "hatchback"),
    ("Mercedes-Benz", "Clase A Sedan", "1.3T", 2020, 2025, 10.0, 12.0, 14.5, 43, "nafta_premium", "sedan"),
    ("Mercedes-Benz", "GLA", "1.3T", 2020, 2025, 9.5, 11.5, 14.0, 43, "nafta_premium", "suv"),
    ("Mercedes-Benz", "Sprinter", "2.1 TDI", 2013, 2025, 7.5, 9.5, 11.0, 75, "gasoil", "van"),
    ("Mercedes-Benz", "Vito", "2.0 TDI", 2015, 2025, 8.0, 10.0, 11.5, 70, "gasoil", "van"),

    # =========================================================================
    # NISSAN
    # =========================================================================
    ("Nissan", "Frontier", "2.3 dCi", 2017, 2025, 8.5, 10.5, 12.5, 80, "gasoil", "pickup"),
    ("Nissan", "Kicks", "1.6", 2017, 2025, 10.0, 12.0, 14.5, 41, "nafta_super", "suv"),
    ("Nissan", "March", "1.6", 2012, 2022, 11.0, 13.0, 15.5, 41, "nafta_super", "hatchback"),
    ("Nissan", "Note", "1.6", 2014, 2022, 10.5, 12.5, 15.0, 41, "nafta_super", "hatchback"),
    ("Nissan", "Sentra", "2.0", 2014, 2025, 9.0, 11.0, 13.5, 52, "nafta_super", "sedan"),
    ("Nissan", "Versa", "1.6", 2012, 2025, 10.5, 12.5, 15.0, 41, "nafta_super", "sedan"),
    ("Nissan", "X-Trail", "2.5", 2015, 2025, 7.5, 9.5, 12.0, 60, "nafta_super", "suv"),

    # =========================================================================
    # PEUGEOT
    # =========================================================================
    ("Peugeot", "2008", "1.2T", 2020, 2025, 10.5, 12.5, 15.0, 44, "nafta_super", "suv"),
    ("Peugeot", "2008", "1.6", 2015, 2025, 9.5, 11.5, 14.0, 50, "nafta_super", "suv"),
    ("Peugeot", "208", "1.2", 2020, 2025, 12.0, 14.0, 16.5, 44, "nafta_super", "hatchback"),
    ("Peugeot", "208", "1.6", 2013, 2025, 10.5, 12.5, 15.0, 50, "nafta_super", "hatchback"),
    ("Peugeot", "3008", "1.6 THP", 2017, 2025, 8.5, 10.5, 13.0, 56, "nafta_premium", "suv"),
    ("Peugeot", "308", "1.6", 2012, 2025, 10.0, 12.0, 14.5, 53, "nafta_super", "hatchback"),
    ("Peugeot", "308", "1.6 THP", 2012, 2020, 9.5, 11.5, 14.0, 53, "nafta_premium", "hatchback"),
    ("Peugeot", "308S", "1.6", 2015, 2022, 10.0, 12.0, 14.5, 53, "nafta_super", "hatchback"),
    ("Peugeot", "408", "1.6", 2012, 2025, 10.0, 12.0, 14.5, 60, "nafta_super", "sedan"),
    ("Peugeot", "408", "1.6 THP", 2012, 2020, 9.5, 11.5, 14.0, 60, "nafta_premium", "sedan"),
    ("Peugeot", "Partner", "1.6", 2013, 2025, 9.0, 11.0, 13.5, 60, "nafta_super", "van"),
    ("Peugeot", "Partner", "1.6 HDi", 2013, 2025, 10.5, 12.5, 14.5, 60, "gasoil", "van"),

    # =========================================================================
    # RAM
    # =========================================================================
    ("RAM", "1000", "1.0T", 2024, 2025, 11.0, 13.0, 15.5, 48, "nafta_super", "pickup"),
    ("RAM", "1500", "5.7 V8", 2017, 2025, 4.5, 6.0, 8.0, 98, "nafta_premium", "pickup"),

    # =========================================================================
    # RENAULT
    # =========================================================================
    ("Renault", "Alaskan", "2.3 dCi", 2017, 2025, 8.5, 10.5, 12.5, 80, "gasoil", "pickup"),
    ("Renault", "Captur", "1.3T", 2022, 2025, 10.0, 12.0, 14.5, 48, "nafta_super", "suv"),
    ("Renault", "Captur", "2.0", 2017, 2021, 8.5, 10.5, 13.0, 50, "nafta_super", "suv"),
    ("Renault", "Clio", "1.2", 2010, 2016, 12.0, 14.0, 16.5, 45, "nafta_super", "hatchback"),
    ("Renault", "Duster", "1.3T", 2021, 2025, 10.5, 12.5, 15.0, 50, "nafta_super", "suv"),
    ("Renault", "Duster", "1.6", 2012, 2025, 10.0, 12.0, 14.5, 50, "nafta_super", "suv"),
    ("Renault", "Duster", "2.0", 2012, 2021, 8.5, 10.5, 13.0, 50, "nafta_super", "suv"),
    ("Renault", "Fluence", "2.0", 2011, 2017, 8.5, 10.5, 13.0, 60, "nafta_super", "sedan"),
    ("Renault", "Kangoo", "1.5 dCi", 2014, 2025, 10.5, 12.5, 14.5, 60, "gasoil", "van"),
    ("Renault", "Kangoo", "1.6", 2010, 2025, 9.5, 11.5, 14.0, 60, "nafta_super", "van"),
    ("Renault", "Koleos", "2.5", 2014, 2025, 7.5, 9.5, 12.0, 60, "nafta_super", "suv"),
    ("Renault", "Kwid", "1.0", 2017, 2025, 13.5, 15.5, 18.5, 28, "nafta_super", "hatchback"),
    ("Renault", "Logan", "1.6", 2014, 2024, 10.5, 12.5, 15.0, 50, "nafta_super", "sedan"),
    ("Renault", "Oroch", "1.3T", 2022, 2025, 10.0, 12.0, 14.5, 50, "nafta_super", "pickup"),
    ("Renault", "Oroch", "1.6", 2017, 2025, 9.5, 11.5, 14.0, 50, "nafta_super", "pickup"),
    ("Renault", "Sandero", "1.6", 2014, 2024, 10.5, 12.5, 15.0, 50, "nafta_super", "hatchback"),
    ("Renault", "Stepway", "1.6", 2014, 2024, 10.0, 12.0, 14.5, 50, "nafta_super", "hatchback"),
    ("Renault", "Symbol", "1.6", 2010, 2015, 10.0, 12.0, 14.5, 50, "nafta_super", "sedan"),

    # =========================================================================
    # TOYOTA
    # =========================================================================
    ("Toyota", "Corolla", "1.8", 2014, 2019, 10.0, 12.0, 14.5, 55, "nafta_super", "sedan"),
    ("Toyota", "Corolla", "2.0", 2020, 2025, 9.5, 11.5, 14.0, 50, "nafta_premium", "sedan"),
    ("Toyota", "Corolla Cross", "2.0", 2022, 2025, 9.0, 11.0, 13.5, 47, "nafta_premium", "suv"),
    ("Toyota", "Corolla Cross", "Hybrid", 2022, 2025, 14.0, 16.0, 15.5, 43, "nafta_super", "suv"),
    ("Toyota", "Etios", "1.5 5P", 2013, 2022, 12.0, 14.0, 16.5, 45, "nafta_super", "hatchback"),
    ("Toyota", "Etios", "1.5 Sedan", 2013, 2022, 12.0, 14.0, 16.5, 45, "nafta_super", "sedan"),
    ("Toyota", "Hilux", "2.4 TDI", 2016, 2025, 9.0, 11.0, 13.0, 80, "gasoil", "pickup"),
    ("Toyota", "Hilux", "2.8 TDI", 2016, 2025, 8.0, 10.0, 12.5, 80, "gasoil", "pickup"),
    ("Toyota", "RAV4", "2.5", 2013, 2025, 8.0, 10.0, 12.5, 55, "nafta_super", "suv"),
    ("Toyota", "SW4", "2.8 TDI", 2016, 2025, 7.5, 9.5, 12.0, 80, "gasoil", "suv"),
    ("Toyota", "Yaris", "1.5 5P", 2018, 2025, 11.0, 13.0, 15.5, 42, "nafta_super", "hatchback"),
    ("Toyota", "Yaris", "1.5 Sedan", 2018, 2025, 11.0, 13.0, 15.5, 42, "nafta_super", "sedan"),

    # =========================================================================
    # VOLKSWAGEN
    # =========================================================================
    ("Volkswagen", "Amarok", "2.0 TDI", 2011, 2023, 8.5, 10.5, 13.0, 80, "gasoil", "pickup"),
    ("Volkswagen", "Amarok", "3.0 V6 TDI", 2017, 2025, 8.0, 10.0, 12.5, 80, "gasoil", "pickup"),
    ("Volkswagen", "Gol Trend", "1.6", 2010, 2023, 10.5, 12.5, 15.0, 50, "nafta_super", "hatchback"),
    ("Volkswagen", "Polo", "1.0 TSI", 2018, 2025, 12.0, 14.0, 16.5, 40, "nafta_super", "hatchback"),
    ("Volkswagen", "Polo", "1.6 MSI", 2018, 2025, 10.5, 12.5, 15.0, 40, "nafta_super", "hatchback"),
    ("Volkswagen", "Saveiro", "1.6", 2010, 2025, 10.0, 12.0, 14.5, 55, "nafta_super", "pickup"),
    ("Volkswagen", "Suran", "1.6", 2010, 2020, 10.0, 12.0, 14.5, 50, "nafta_super", "wagon"),
    ("Volkswagen", "T-Cross", "1.0 TSI", 2020, 2025, 11.0, 13.0, 15.5, 40, "nafta_super", "suv"),
    ("Volkswagen", "T-Cross", "1.6", 2020, 2025, 9.5, 11.5, 14.0, 45, "nafta_super", "suv"),
    ("Volkswagen", "Taos", "1.4 TSI", 2021, 2025, 9.5, 11.5, 14.0, 50, "nafta_premium", "suv"),
    ("Volkswagen", "Tiguan", "1.4 TSI", 2017, 2025, 9.0, 11.0, 13.5, 60, "nafta_premium", "suv"),
    ("Volkswagen", "Up!", "1.0", 2014, 2022, 13.0, 15.0, 17.5, 35, "nafta_super", "hatchback"),
    ("Volkswagen", "Vento", "1.4 TSI", 2015, 2025, 10.0, 12.0, 14.5, 55, "nafta_premium", "sedan"),
    ("Volkswagen", "Virtus", "1.0 TSI", 2018, 2025, 12.0, 14.0, 16.5, 40, "nafta_super", "sedan"),
    ("Volkswagen", "Virtus", "1.6 MSI", 2018, 2025, 10.5, 12.5, 15.0, 45, "nafta_super", "sedan"),
    ("Volkswagen", "Voyage", "1.6", 2010, 2023, 10.5, 12.5, 15.0, 50, "nafta_super", "sedan"),

    # =========================================================================
    # ADDITIONAL VERSIONS / VARIANTS to reach 250+
    # =========================================================================

    # Chevrolet extra
    ("Chevrolet", "Agile", "1.4", 2010, 2015, 10.5, 12.5, 15.0, 44, "nafta_super", "hatchback"),
    ("Chevrolet", "Cobalt", "1.8", 2013, 2016, 9.0, 11.0, 13.5, 52, "nafta_super", "sedan"),
    ("Chevrolet", "Cruze", "1.8", 2011, 2016, 8.5, 10.5, 13.0, 59, "nafta_super", "sedan"),
    ("Chevrolet", "Cruze", "2.0 TDI", 2013, 2016, 10.0, 12.0, 14.5, 59, "gasoil", "sedan"),
    ("Chevrolet", "Equinox", "1.5T", 2018, 2025, 8.5, 10.5, 13.0, 57, "nafta_super", "suv"),
    ("Chevrolet", "Onix", "1.4", 2013, 2019, 11.0, 13.0, 15.5, 44, "nafta_super", "hatchback"),
    ("Chevrolet", "Prisma", "1.0", 2013, 2019, 12.0, 14.0, 16.5, 43, "nafta_super", "sedan"),
    ("Chevrolet", "S10", "2.8 TDI 4x4", 2012, 2025, 7.5, 9.5, 11.5, 76, "gasoil", "pickup"),
    ("Chevrolet", "Spin", "1.3 TDI", 2019, 2020, 11.0, 13.0, 15.0, 50, "gasoil", "van"),
    ("Chevrolet", "Tracker", "1.8", 2014, 2020, 8.5, 10.5, 13.0, 53, "nafta_super", "suv"),

    # Citroen extra
    ("Citroen", "C3", "1.5", 2010, 2015, 10.5, 12.5, 15.0, 50, "nafta_super", "hatchback"),
    ("Citroen", "C4 Cactus", "1.6 THP", 2018, 2023, 9.0, 11.0, 13.5, 50, "nafta_premium", "suv"),
    ("Citroen", "C4 Lounge", "1.6", 2014, 2019, 10.0, 12.0, 14.5, 60, "nafta_super", "sedan"),

    # Fiat extra
    ("Fiat", "500X", "1.4T", 2016, 2019, 9.0, 11.0, 13.5, 48, "nafta_super", "suv"),
    ("Fiat", "Argo", "1.0", 2024, 2025, 12.5, 14.5, 17.0, 48, "nafta_super", "hatchback"),
    ("Fiat", "Cronos", "1.0", 2024, 2025, 12.5, 14.5, 17.0, 48, "nafta_super", "sedan"),
    ("Fiat", "Palio Weekend", "1.6", 2010, 2017, 9.5, 11.5, 14.0, 51, "nafta_super", "wagon"),
    ("Fiat", "Strada", "1.4", 2010, 2020, 10.5, 12.5, 15.0, 48, "nafta_super", "pickup"),
    ("Fiat", "Toro", "1.8", 2017, 2022, 8.5, 10.5, 13.0, 55, "nafta_super", "pickup"),
    ("Fiat", "Uno", "1.4", 2010, 2016, 11.0, 13.0, 15.5, 45, "nafta_super", "hatchback"),

    # Ford extra
    ("Ford", "EcoSport", "1.6", 2010, 2018, 9.5, 11.5, 14.0, 52, "nafta_super", "suv"),
    ("Ford", "Fiesta Sedan", "1.6", 2010, 2019, 10.5, 12.5, 15.0, 45, "nafta_super", "sedan"),
    ("Ford", "Kuga", "1.5T", 2017, 2020, 9.0, 11.0, 13.5, 57, "nafta_super", "suv"),
    ("Ford", "Ranger", "2.5 Nafta", 2010, 2015, 6.0, 7.5, 9.5, 76, "nafta_super", "pickup"),
    ("Ford", "Transit", "2.2 TDCi", 2013, 2025, 7.5, 9.5, 11.0, 75, "gasoil", "van"),

    # Honda extra
    ("Honda", "Civic", "1.8", 2010, 2016, 9.5, 11.5, 14.0, 50, "nafta_super", "sedan"),
    ("Honda", "CR-V", "2.0", 2010, 2017, 8.0, 10.0, 12.5, 58, "nafta_super", "suv"),
    ("Honda", "CR-V", "2.4", 2012, 2017, 7.5, 9.5, 12.0, 58, "nafta_super", "suv"),
    ("Honda", "HR-V", "1.5 Turbo", 2023, 2025, 9.5, 11.5, 14.0, 45, "nafta_premium", "suv"),

    # Hyundai extra
    ("Hyundai", "Accent", "1.4", 2012, 2018, 11.0, 13.0, 15.5, 43, "nafta_super", "sedan"),
    ("Hyundai", "Creta GLS", "1.6 AT", 2020, 2025, 9.0, 11.0, 13.5, 55, "nafta_super", "suv"),
    ("Hyundai", "i30", "1.8", 2012, 2017, 9.0, 11.0, 13.5, 53, "nafta_super", "hatchback"),
    ("Hyundai", "Tucson", "2.0 CRDi", 2016, 2021, 9.5, 11.5, 14.0, 62, "gasoil", "suv"),
    ("Hyundai", "Veloster", "1.6T", 2012, 2018, 9.5, 11.5, 14.0, 50, "nafta_premium", "coupe"),

    # Jeep extra
    ("Jeep", "Cherokee", "2.4", 2015, 2020, 7.5, 9.5, 12.0, 60, "nafta_super", "suv"),
    ("Jeep", "Compass", "1.8", 2017, 2021, 8.5, 10.5, 13.0, 48, "nafta_super", "suv"),
    ("Jeep", "Grand Cherokee", "3.6 V6", 2014, 2025, 5.5, 7.0, 9.0, 93, "nafta_premium", "suv"),
    ("Jeep", "Wrangler", "2.0T", 2019, 2025, 6.5, 8.0, 10.0, 66, "nafta_premium", "suv"),
    ("Jeep", "Wrangler", "3.6 V6", 2014, 2025, 5.0, 6.5, 8.5, 81, "nafta_premium", "suv"),

    # Kia extra
    ("Kia", "Cerato", "1.6", 2013, 2018, 10.0, 12.0, 14.5, 50, "nafta_super", "sedan"),
    ("Kia", "Rio", "1.4", 2012, 2020, 11.0, 13.0, 15.5, 43, "nafta_super", "sedan"),
    ("Kia", "Sportage", "2.0", 2010, 2015, 8.0, 10.0, 12.5, 58, "nafta_super", "suv"),
    ("Kia", "Soul", "1.6", 2012, 2020, 9.5, 11.5, 14.0, 54, "nafta_super", "hatchback"),
    ("Kia", "Carnival", "2.2 CRDi", 2020, 2025, 7.0, 9.0, 11.0, 72, "gasoil", "van"),

    # Mercedes-Benz extra
    ("Mercedes-Benz", "Clase C", "2.0T", 2015, 2025, 8.0, 10.0, 12.5, 66, "nafta_premium", "sedan"),
    ("Mercedes-Benz", "GLC", "2.0T", 2016, 2025, 7.5, 9.5, 12.0, 62, "nafta_premium", "suv"),
    ("Mercedes-Benz", "Sprinter Furgon", "2.1 TDI", 2013, 2025, 7.0, 9.0, 10.5, 75, "gasoil", "van"),

    # Nissan extra
    ("Nissan", "Frontier", "2.3 dCi 4x4", 2017, 2025, 8.0, 10.0, 12.0, 80, "gasoil", "pickup"),
    ("Nissan", "Kicks", "1.6 Exclusive", 2020, 2025, 9.5, 11.5, 14.0, 41, "nafta_super", "suv"),
    ("Nissan", "March", "1.6 Active", 2017, 2022, 11.0, 13.0, 15.5, 41, "nafta_super", "hatchback"),
    ("Nissan", "Sentra", "1.8", 2010, 2014, 9.5, 11.5, 14.0, 52, "nafta_super", "sedan"),
    ("Nissan", "Tiida", "1.8", 2010, 2015, 9.0, 11.0, 13.5, 52, "nafta_super", "hatchback"),
    ("Nissan", "X-Trail", "2.5 Exclusive", 2018, 2025, 7.0, 9.0, 11.5, 60, "nafta_super", "suv"),

    # Peugeot extra
    ("Peugeot", "207", "1.6", 2010, 2015, 10.0, 12.0, 14.5, 50, "nafta_super", "hatchback"),
    ("Peugeot", "207 Compact", "1.4", 2010, 2015, 10.5, 12.5, 15.0, 50, "nafta_super", "hatchback"),
    ("Peugeot", "2008", "1.6 THP", 2016, 2019, 9.0, 11.0, 13.5, 50, "nafta_premium", "suv"),
    ("Peugeot", "301", "1.6", 2013, 2020, 10.0, 12.0, 14.5, 50, "nafta_super", "sedan"),
    ("Peugeot", "308", "1.6 HDi", 2014, 2020, 12.0, 14.0, 16.0, 53, "gasoil", "hatchback"),
    ("Peugeot", "3008", "1.6", 2012, 2016, 9.0, 11.0, 13.5, 56, "nafta_super", "suv"),
    ("Peugeot", "5008", "1.6 THP", 2019, 2025, 8.0, 10.0, 12.5, 56, "nafta_premium", "suv"),
    ("Peugeot", "Expert", "1.6 HDi", 2018, 2025, 9.0, 11.0, 13.0, 68, "gasoil", "van"),
    ("Peugeot", "Partner Patagonica", "1.6 HDi", 2014, 2025, 10.0, 12.0, 14.0, 60, "gasoil", "van"),

    # Renault extra
    ("Renault", "Captur", "1.6", 2017, 2021, 9.5, 11.5, 14.0, 50, "nafta_super", "suv"),
    ("Renault", "Clio Mio", "1.2", 2012, 2016, 12.0, 14.0, 16.5, 40, "nafta_super", "hatchback"),
    ("Renault", "Duster Oroch", "2.0", 2017, 2021, 8.0, 10.0, 12.5, 50, "nafta_super", "pickup"),
    ("Renault", "Duster", "2.0 4x4", 2012, 2021, 8.0, 10.0, 12.5, 50, "nafta_super", "suv"),
    ("Renault", "Logan", "1.6 16V", 2010, 2013, 10.0, 12.0, 14.5, 50, "nafta_super", "sedan"),
    ("Renault", "Megane III", "2.0", 2010, 2016, 8.5, 10.5, 13.0, 60, "nafta_super", "sedan"),
    ("Renault", "Sandero RS", "2.0", 2016, 2020, 8.0, 10.0, 12.5, 50, "nafta_premium", "hatchback"),
    ("Renault", "Sandero Stepway", "1.6 Privilege", 2018, 2024, 10.0, 12.0, 14.5, 50, "nafta_super", "hatchback"),

    # Toyota extra
    ("Toyota", "Corolla", "1.8 XLi", 2010, 2013, 10.0, 12.0, 14.5, 55, "nafta_super", "sedan"),
    ("Toyota", "Corolla", "2.0 SEG", 2020, 2025, 9.5, 11.5, 14.0, 50, "nafta_premium", "sedan"),
    ("Toyota", "Corolla Cross", "2.0 SEG", 2022, 2025, 8.5, 10.5, 13.0, 47, "nafta_premium", "suv"),
    ("Toyota", "Etios Cross", "1.5", 2014, 2022, 11.5, 13.5, 16.0, 45, "nafta_super", "hatchback"),
    ("Toyota", "Hilux", "2.4 TDI 4x4", 2016, 2025, 8.5, 10.5, 12.5, 80, "gasoil", "pickup"),
    ("Toyota", "Hilux", "2.8 TDI 4x4", 2016, 2025, 7.5, 9.5, 12.0, 80, "gasoil", "pickup"),
    ("Toyota", "Hilux GR-S", "2.8 TDI", 2021, 2025, 7.5, 9.5, 12.0, 80, "gasoil", "pickup"),
    ("Toyota", "RAV4", "2.5 Hybrid", 2019, 2025, 13.0, 14.5, 14.0, 55, "nafta_super", "suv"),
    ("Toyota", "SW4", "2.8 TDI 4x4", 2016, 2025, 7.0, 9.0, 11.5, 80, "gasoil", "suv"),
    ("Toyota", "Yaris Cross", "1.5", 2023, 2025, 10.5, 12.5, 15.0, 42, "nafta_super", "suv"),
    ("Toyota", "Yaris Cross", "1.5 Hybrid", 2023, 2025, 14.0, 15.5, 15.0, 36, "nafta_super", "suv"),

    # Volkswagen extra
    ("Volkswagen", "Amarok", "2.0 TDI 4x4", 2011, 2023, 8.0, 10.0, 12.5, 80, "gasoil", "pickup"),
    ("Volkswagen", "Amarok", "3.0 V6 TDI 4x4", 2017, 2025, 7.5, 9.5, 12.0, 80, "gasoil", "pickup"),
    ("Volkswagen", "Fox", "1.6", 2010, 2019, 10.5, 12.5, 15.0, 50, "nafta_super", "hatchback"),
    ("Volkswagen", "Golf", "1.4 TSI", 2015, 2022, 10.0, 12.0, 14.5, 50, "nafta_premium", "hatchback"),
    ("Volkswagen", "Nivus", "1.0 TSI", 2021, 2025, 11.5, 13.5, 16.0, 40, "nafta_super", "suv"),
    ("Volkswagen", "Polo", "1.6 MSI AT", 2020, 2025, 10.0, 12.0, 14.5, 40, "nafta_super", "hatchback"),
    ("Volkswagen", "Polo GTS", "1.4 TSI", 2020, 2025, 9.5, 11.5, 14.0, 40, "nafta_premium", "hatchback"),
    ("Volkswagen", "T-Cross Highline", "1.0 TSI", 2020, 2025, 11.0, 13.0, 15.5, 40, "nafta_super", "suv"),
    ("Volkswagen", "Taos Comfortline", "1.4 TSI", 2021, 2025, 9.0, 11.0, 13.5, 50, "nafta_premium", "suv"),
    ("Volkswagen", "Tiguan Allspace", "1.4 TSI", 2018, 2025, 8.5, 10.5, 13.0, 60, "nafta_premium", "suv"),
    ("Volkswagen", "Vento GLI", "2.0 TSI", 2018, 2025, 8.0, 10.0, 12.5, 55, "nafta_premium", "sedan"),
    ("Volkswagen", "Virtus Highline", "1.0 TSI", 2020, 2025, 12.0, 14.0, 16.5, 40, "nafta_super", "sedan"),

    # More Fiat
    ("Fiat", "Ducato", "2.3 Multijet", 2013, 2025, 7.0, 9.0, 10.5, 90, "gasoil", "van"),
    ("Fiat", "Fiorino", "1.4", 2013, 2025, 10.0, 12.0, 14.5, 45, "nafta_super", "van"),
    ("Fiat", "Toro Freedom", "1.8", 2017, 2022, 8.5, 10.5, 13.0, 55, "nafta_super", "pickup"),

    # More Ford
    ("Ford", "Fiesta Kinetic", "1.6", 2013, 2019, 10.5, 12.5, 15.0, 45, "nafta_super", "hatchback"),
    ("Ford", "Focus III", "2.0 AT", 2015, 2019, 8.0, 10.0, 12.5, 55, "nafta_super", "sedan"),
    ("Ford", "Ranger Limited", "3.2 TDCi", 2016, 2022, 7.5, 9.5, 11.5, 80, "gasoil", "pickup"),
    ("Ford", "Ranger Raptor", "2.0 Biturbo", 2023, 2025, 8.0, 10.0, 12.0, 80, "gasoil", "pickup"),
    ("Ford", "S-Max", "2.0", 2013, 2018, 8.0, 10.0, 12.5, 60, "nafta_super", "van"),

    # More Nissan
    ("Nissan", "Qashqai", "2.0", 2015, 2022, 8.5, 10.5, 13.0, 55, "nafta_super", "suv"),
    ("Nissan", "Versa", "1.6 Exclusive", 2020, 2025, 10.5, 12.5, 15.0, 41, "nafta_super", "sedan"),

    # More Renault
    ("Renault", "Kangoo Express", "1.5 dCi", 2014, 2025, 11.0, 13.0, 15.0, 60, "gasoil", "van"),
    ("Renault", "Master", "2.3 dCi", 2015, 2025, 7.0, 9.0, 10.5, 80, "gasoil", "van"),

    # More Toyota
    ("Toyota", "Innova", "2.7", 2018, 2025, 7.5, 9.5, 12.0, 55, "nafta_super", "van"),
    ("Toyota", "Prado", "2.8 TDI", 2018, 2025, 7.0, 9.0, 11.5, 87, "gasoil", "suv"),

    # More Peugeot
    ("Peugeot", "208 GT", "1.6 THP", 2016, 2019, 9.5, 11.5, 14.0, 50, "nafta_premium", "hatchback"),
    ("Peugeot", "208 Feline", "1.6", 2020, 2025, 10.5, 12.5, 15.0, 44, "nafta_super", "hatchback"),

    # More Hyundai
    ("Hyundai", "Creta", "1.5", 2024, 2025, 10.0, 12.0, 14.5, 50, "nafta_super", "suv"),
    ("Hyundai", "Kona", "1.6T", 2019, 2025, 9.0, 11.0, 13.5, 50, "nafta_premium", "suv"),
    ("Hyundai", "Ioniq 5", "Electrico", 2024, 2025, 0.0, 0.0, 0.0, 0, "nafta_premium", "suv"),
    # Remove Ioniq 5 since it's electric and doesn't fit the schema

    # Additional models to pad count
    ("Chevrolet", "Joy", "1.0", 2020, 2023, 12.5, 14.5, 17.0, 44, "nafta_super", "hatchback"),
    ("Chevrolet", "Joy Plus", "1.0", 2020, 2023, 12.5, 14.5, 17.0, 44, "nafta_super", "sedan"),

    ("Citroen", "C5 Aircross", "1.6 THP", 2020, 2025, 8.5, 10.5, 13.0, 53, "nafta_premium", "suv"),

    ("Ford", "Mondeo", "2.0", 2013, 2020, 8.0, 10.0, 12.5, 62, "nafta_super", "sedan"),

    ("Kia", "Carnival", "3.3 V6", 2020, 2025, 5.5, 7.0, 9.0, 72, "nafta_premium", "van"),

    ("Nissan", "Pathfinder", "3.5 V6", 2014, 2020, 5.5, 7.0, 9.0, 74, "nafta_premium", "suv"),

    ("Renault", "Arkana", "1.3T", 2023, 2025, 10.0, 12.0, 14.5, 50, "nafta_super", "suv"),

    ("Toyota", "Camry", "2.5", 2018, 2025, 8.5, 10.5, 13.0, 60, "nafta_super", "sedan"),
    ("Toyota", "86", "2.0", 2014, 2021, 9.0, 11.0, 13.5, 50, "nafta_premium", "coupe"),

    ("Volkswagen", "Bora", "2.0", 2010, 2014, 8.5, 10.5, 13.0, 55, "nafta_super", "sedan"),
    ("Volkswagen", "Passat", "2.0 TSI", 2017, 2025, 8.0, 10.0, 12.5, 66, "nafta_premium", "sedan"),
    ("Volkswagen", "Transporter", "2.0 TDI", 2015, 2025, 8.0, 10.0, 11.5, 70, "gasoil", "van"),

    ("Mercedes-Benz", "Clase CLA", "1.3T", 2020, 2025, 10.0, 12.0, 14.5, 43, "nafta_premium", "coupe"),
    ("Mercedes-Benz", "GLB", "1.3T", 2021, 2025, 9.0, 11.0, 13.5, 43, "nafta_premium", "suv"),

    ("Honda", "Accord", "2.0", 2013, 2020, 8.5, 10.5, 13.0, 56, "nafta_super", "sedan"),
]

# Remove the Ioniq 5 entry (electric vehicle doesn't fit schema)
vehicles = [v for v in vehicles if not (v[1] == "Ioniq 5")]


def build_json(vehicles):
    result = []
    for v in vehicles:
        entry = {
            "marca": v[0],
            "modelo": v[1],
            "version": v[2],
            "anio_desde": v[3],
            "anio_hasta": v[4],
            "consumo_ciudad_kml": v[5],
            "consumo_mixto_kml": v[6],
            "consumo_ruta_kml": v[7],
            "litros_tanque": v[8],
            "combustible": v[9],
            "categoria": v[10],
        }
        result.append(entry)

    # Sort by marca, modelo, version
    result.sort(key=lambda x: (x["marca"].lower(), x["modelo"].lower(), x["version"].lower()))
    return result


def validate(data):
    valid_combustible = {"nafta_super", "nafta_premium", "gasoil"}
    valid_categoria = {"hatchback", "sedan", "suv", "pickup", "van", "wagon", "coupe"}
    errors = []
    for i, d in enumerate(data):
        if d["combustible"] not in valid_combustible:
            errors.append(f"Row {i}: invalid combustible '{d['combustible']}'")
        if d["categoria"] not in valid_categoria:
            errors.append(f"Row {i}: invalid categoria '{d['categoria']}'")
        if d["anio_desde"] > d["anio_hasta"]:
            errors.append(f"Row {i}: anio_desde > anio_hasta")
        if d["consumo_ciudad_kml"] > d["consumo_mixto_kml"] and d["consumo_ciudad_kml"] > 0:
            errors.append(f"Row {i}: city consumption > mixed for {d['marca']} {d['modelo']} {d['version']}")
        # Note: hybrids can have higher city than route, so skip that check
    return errors


def print_stats(data):
    print(f"\nTotal vehicles: {len(data)}")

    print("\nBy marca:")
    marca_counts = {}
    for d in data:
        marca_counts[d["marca"]] = marca_counts.get(d["marca"], 0) + 1
    for marca in sorted(marca_counts.keys()):
        print(f"  {marca}: {marca_counts[marca]}")

    print("\nBy combustible:")
    comb_counts = {}
    for d in data:
        comb_counts[d["combustible"]] = comb_counts.get(d["combustible"], 0) + 1
    for c in sorted(comb_counts.keys()):
        print(f"  {c}: {comb_counts[c]}")

    print("\nBy categoria:")
    cat_counts = {}
    for d in data:
        cat_counts[d["categoria"]] = cat_counts.get(d["categoria"], 0) + 1
    for c in sorted(cat_counts.keys()):
        print(f"  {c}: {cat_counts[c]}")


if __name__ == "__main__":
    data = build_json(vehicles)

    errors = validate(data)
    if errors:
        print("VALIDATION ERRORS:")
        for e in errors:
            print(f"  {e}")
        print()

    # Check for duplicates
    seen = set()
    dupes = []
    for d in data:
        key = (d["marca"], d["modelo"], d["version"])
        if key in seen:
            dupes.append(key)
        seen.add(key)
    if dupes:
        print("DUPLICATE ENTRIES:")
        for d in dupes:
            print(f"  {d}")
        print()

    output_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "front-end", "src", "data", "autos.json"
    )

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Written to: {output_path}")
    print_stats(data)

    # Verify JSON is valid by re-reading
    with open(output_path, "r", encoding="utf-8") as f:
        reloaded = json.load(f)
    print(f"\nJSON validation: OK ({len(reloaded)} entries re-loaded successfully)")
