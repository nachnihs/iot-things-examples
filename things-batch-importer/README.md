# Bosch IoT Things - Batch Importer Tool

### Description
This tool is designed to import things from one or more files in a specific directory into a Bosch IoT Things service instance.
The file(s) should contain one thing per line in JSON format e.g.

`{ "thingId": "namespace:thing-name", "policyId": "namespace:policy-name", "attributes": { "foo": 1 }, "features": {...} }`


##### Prerequisites:

- Knowledge of Java
- Knowledge of Maven
- [Solution](https://docs.bosch-iot-suite.com/things/getting-started/booking/basic-data/) information like solutionId and apiToken have to be present.
- [Namespace](https://docs.bosch-iot-suite.com/things/getting-started/booking/manage-namespace/) in which the things should be imported, have to be created.
- Import file(s) with one thing per line in JSON format.
- [User of Bosch IoT Permissions](https://docs.bosch-iot-suite.com/things/examples-demo/createuser/) or - alternatively - [Public Key](https://docs.bosch-iot-suite.com/things/getting-started/booking/manage-key/) for authenticating the Things client.
- Websocket endpoint has to be configured in config.properties.

### Preparation

Create at least one [policy](https://docs.bosch-iot-suite.com/asset-communication/Initial-policy.html) which you can assigned to your things.\
Set your credentials under `/src/main/resources/config.properties`. You can use `src/main/resources/config-template.properties` as a template.

### How to build Things batch importer tool
Build the jar file with following command.
```bash 
mvn clean install
```

### How to run Things batch importer tool 

```$bash
cd target
java -Xms2G -Xmx4G -DthingsConfigFile="### absolutePathToConfig ###" -jar things-batch-importer-0-SNAPSHOT-jar-with-dependencies.jar "### absolutePathToUploadDirectory ###"
```

If the import is interrupted the import tool can just be re-executed. It then continues to import where it previously stopped.

### Created files during batch import
The import tool will create the following files during the batch import:
- completedFile.txt - contains all files which were uploaded successfully.
- errorFile - contains the error messages for the things which could not be uploaded.
- retryFile.txt - contains the things and the error message why it could not be uploaded, separated by a '#'. 

# License

See the iot-things-examples top level README.md file for license details.
