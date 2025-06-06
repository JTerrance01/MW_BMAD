FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/MixWarz.API/MixWarz.API.csproj", "MixWarz.API/"]
COPY ["src/MixWarz.Application/MixWarz.Application.csproj", "MixWarz.Application/"]
COPY ["src/MixWarz.Domain/MixWarz.Domain.csproj", "MixWarz.Domain/"]
COPY ["src/MixWarz.Infrastructure/MixWarz.Infrastructure.csproj", "MixWarz.Infrastructure/"]
RUN dotnet restore "MixWarz.API/MixWarz.API.csproj"
COPY src/ .
WORKDIR "/src/MixWarz.API"
RUN dotnet build "MixWarz.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MixWarz.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MixWarz.API.dll"] 