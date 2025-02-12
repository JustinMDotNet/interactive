// Copyright (c) .NET Foundation and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from "chai";
import { createDotnetInteractiveClient } from "../src/dotnet-interactive-browser/kernel-client-impl";
import * as fetchMock from "fetch-mock";
import { VariableResponse, VariableRequest } from "../src/dotnet-interactive/dotnet-interactive-interfaces";
import { asKernelClientContainer, configureFetchForKernelDiscovery, createMockKernelTransport } from "./testSupport";

describe("dotnet-interactive", () => {
    describe("variable api contract", () => {
        const rootUrl = "https://dotnet.interactive.com:999";

        beforeEach(() => {
            configureFetchForKernelDiscovery(rootUrl);
        });

        afterEach(() => fetchMock.restore());

        it("can load multiple variables in a single request", async () => {
            let expectedVariables: VariableResponse = {
                csharp:
                {
                    number: 1,
                    number_as_string: "2"
                },
                fsharp: {
                    number: 3,
                    boolean: false
                }
            }

            let varaibleRequest: VariableRequest = {
                csharp: ["number", "number_as_string"],
                fsharp: ["number", "boolean"]
            };

            fetchMock.post(`${rootUrl}/variables`,
                require("./Responses/variable-post-response.json"),
                {
                    body: varaibleRequest
                });

            let client = await createDotnetInteractiveClient({
                address: rootUrl,
                kernelTransportFactory: createMockKernelTransport
            });

            let variables = await client.getVariables(varaibleRequest);

            expect(variables).to.deep.eq(expectedVariables);
        });

        it("can load variable using kernel client", async () => {
            let expectedVariable = 123;
            let variableName = "data";
            let kernelName = "csharp";

            fetchMock.get(`${rootUrl}/variables/${kernelName}/${variableName}`,
                {
                    body: expectedVariable,
                    status: 200
                });

            let client = asKernelClientContainer(await createDotnetInteractiveClient({
                address: rootUrl,
                kernelTransportFactory: createMockKernelTransport
            }));

            let csharpClient = client[kernelName];
            let variable = await csharpClient.getVariable(variableName);

            expect(variable).to.deep.eq(expectedVariable);
        });
    });
});