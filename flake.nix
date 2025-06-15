{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";
    flocken = {
      url = "github:mirkolenz/flocken/v2";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  nixConfig = {
    extra-substituters = [
      "https://nix-community.cachix.org"
      "https://recap.cachix.org"
    ];
    extra-trusted-public-keys = [
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
      "recap.cachix.org-1:KElwRDtaJbbQxmmS2SyxWHqs9bdJbaZHzb2iINTfQws="
    ];
  };
  outputs =
    inputs@{
      flake-parts,
      systems,
      flocken,
      self,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import systems;
      imports = [
        inputs.treefmt-nix.flakeModule
      ];
      perSystem =
        {
          pkgs,
          system,
          lib,
          config,
          ...
        }:
        {
          _module.args.pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = lib.singleton (
              final: prev: {
                nodejs = final.nodejs_22;
              }
            );
          };
          devShells.default = pkgs.mkShell {
            shellHook = ''
              ${lib.getExe' pkgs.nodejs "npm"} install
              ${lib.getExe pkgs.nodejs} --version > .node-version
            '';
            packages = with pkgs; [
              nodejs
              config.treefmt.build.wrapper
            ];
          };
          checks = {
            inherit (config.packages) arguemapper server docker;
          };
          treefmt = {
            projectRootFile = "flake.nix";
            programs = {
              biome.enable = true;
              nixfmt.enable = true;
            };
          };
          packages = {
            default = config.packages.arguemapper;
            server = config.packages.arguemapper-server;
            arguemapper = pkgs.callPackage ./default.nix { };
            arguemapper-server = pkgs.callPackage ./server.nix {
              inherit (config.packages) arguemapper;
            };
            docker = pkgs.callPackage ./docker.nix {
              inherit (config.packages) arguemapper-server;
            };
          };
          legacyPackages.docker-manifest = flocken.legacyPackages.${system}.mkDockerManifest {
            github = {
              enable = true;
              token = "$GH_TOKEN";
            };
            version = builtins.getEnv "VERSION";
            imageStreams = with self.packages; [ x86_64-linux.docker ];
          };
        };
    };
}
