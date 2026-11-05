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
          lib,
          system,
          config,
          ...
        }:
        {
          devShells.default = pkgs.callPackage ./shell.nix {
            treefmt = config.treefmt.build.wrapper;
          };
          checks = config.packages;
          treefmt = {
            projectRootFile = "flake.nix";
            programs = {
              nixfmt.enable = true;
              oxfmt.enable = true;
            };
            settings.formatter.caddy = {
              command = lib.getExe pkgs.caddy;
              options = [
                "fmt"
                "--overwrite"
              ];
              includes = [ "Caddyfile" ];
            };
          };
          packages = {
            default = config.packages.arguemapper;
            arguemapper = pkgs.callPackage ./default.nix { };
            server = pkgs.callPackage ./server.nix {
              inherit (config.packages) arguemapper;
            };
          }
          // lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
            docker = pkgs.callPackage ./docker.nix {
              inherit (config.packages) server;
            };
          };
          legacyPackages.docker-manifest = flocken.legacyPackages.${system}.mkDockerManifest {
            github.enable = true;
            images = with self.packages; [ x86_64-linux.docker ];
          };
        };
    };
}
