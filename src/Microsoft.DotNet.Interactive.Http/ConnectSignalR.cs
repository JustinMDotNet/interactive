﻿// Copyright (c) .NET Foundation and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

using System.CommandLine;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.DotNet.Interactive.Connection;

namespace Microsoft.DotNet.Interactive.Http
{
    public class ConnectSignalR : ConnectKernelCommand<SignalRConnectionOptions>
    {
        public ConnectSignalR() : base("signalr", "Connects to a kernel using SignalR")
        {
            AddOption(new Option<string>("--hub-url", "The URL of the SignalR hub"));
        }

        public override async Task<Kernel> CreateKernelAsync(
            SignalRConnectionOptions options,
            KernelInvocationContext context)
        {
            var connection = new HubConnectionBuilder()
                             .WithUrl(options.HubUrl)
                             .Build();

            await connection.StartAsync();

            await connection.SendAsync("connect");

            var receiver = new KernelCommandAndEventSignalRHubConnectionReceiver(connection);
            var sender = new KernelCommandAndEventSignalRHubConnectionSender(connection);
            var proxyKernel = new ProxyKernel(options.KernelName, receiver, sender);

            var _ = proxyKernel.RunAsync();

            proxyKernel.RegisterForDisposal(receiver);
            proxyKernel.RegisterForDisposal(async () =>
            {
                await connection.DisposeAsync();
            });

            return proxyKernel;
        }
    }
}