/**
 * WorldMapAdapter.js
 * Adapter for WorldMapVisualization.js to incorporate player bio functionality
 */

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Add portrait interaction after a delay to ensure the map is initialized
    setTimeout(function() {
      setupPortraitInteractions();
    }, 2000);
    
    function setupPortraitInteractions() {
      // Get references to the portrait buttons
      const aaronPortrait = document.getElementById("aaron-portrait");
      const nikolayPortrait = document.getElementById("nikolay-portrait");
      const bioContainer = document.getElementById("player-bio-container");
      const bioName = document.getElementById("bio-name");
      const bioText = document.getElementById("bio-text");
      
      // Make sure we have the player bio data
      if (!window.playerBios) {
        window.playerBios = {
          aaron: {
            name: "Aaron Reeve Mendes",
            bio: "Aaron Reeve Mendes (born September 2012) is a rising chess prodigy who began playing at the age of five in India before immigrating to Mississauga, Canada, in 2021. Known for his tactical creativity and strategic skill, he became the youngest Canadian to defeat a grandmaster at 9 years old in 2022 and earned the International Master title in 2024 after winning gold in the Under-18 category at the North American Youth Chess Championship."
          },
          nikolay: {
            name: "Nikolay Noritsyn",
            bio: "Nikolay Noritsyn (born May 1991) is a Russian-born Canadian International Master and chess coach who moved to Canada in 2001. He won the Canadian Closed Championship in 2007, earning his IM title, and has represented Canada in multiple Chess Olympiads. Known for his aggressive play and deep opening preparation, his CFC rating progression reflects his games played in Canada, following an international chess career that began before his immigration."
          }
        };
      }
      
      // Function to show player bio
      function showPlayerBio(playerId) {
        const playerData = window.playerBios[playerId];
        
        if (playerData) {
          // Set content
          bioName.textContent = playerData.name;
          bioText.textContent = playerData.bio;
          
          // Remove existing player classes
          bioContainer.classList.remove("aaron", "nikolay");
          // Add player-specific class
          bioContainer.classList.add(playerId);
          
          // Show container with animation
          bioContainer.style.display = "block";
          
          // Trigger animation
          setTimeout(() => {
            bioContainer.style.opacity = "1";
          }, 10);
        } else {
          hidePlayerBio();
        }
      }
      
      // Function to hide player bio
      function hidePlayerBio() {
        bioContainer.style.opacity = "0";
        
        setTimeout(() => {
          bioContainer.style.display = "none";
        }, 500);
      }
      
      // Add click handlers to portraits if they exist
      if (aaronPortrait) {
        aaronPortrait.addEventListener("click", function() {
          // Clear active state from both portraits
          document.querySelectorAll(".player-portrait").forEach(portrait => {
            portrait.classList.remove("active");
          });
          
          // Set active state to this portrait
          this.classList.add("active");
          
          // Show player bio
          showPlayerBio("aaron");
          
          // Trigger the India-Canada connection in the map visualization
          if (window.ChessApp && 
              window.ChessApp.visualizations.map && 
              window.ChessApp.visualizations.map.instance) {
            
            // Find the india-canada connection
            const connections = window.ChessApp.visualizations.map.instance.connections;
            const connection = connections.find(conn => conn.id === "india-canada");
            
            if (connection) {
              // Set active connection and animate
              window.ChessApp.visualizations.map.instance.activeConnections = [connection];
              window.ChessApp.visualizations.map.instance.animateConnection(connection);
            }
          }
        });
      }
      
      if (nikolayPortrait) {
        nikolayPortrait.addEventListener("click", function() {
          // Clear active state from both portraits
          document.querySelectorAll(".player-portrait").forEach(portrait => {
            portrait.classList.remove("active");
          });
          
          // Set active state to this portrait
          this.classList.add("active");
          
          // Show player bio
          showPlayerBio("nikolay");
          
          // Trigger the Russia-Canada connection in the map visualization
          if (window.ChessApp && 
              window.ChessApp.visualizations.map && 
              window.ChessApp.visualizations.map.instance) {
            
            // Find the russia-canada connection
            const connections = window.ChessApp.visualizations.map.instance.connections;
            const connection = connections.find(conn => conn.id === "russia-canada");
            
            if (connection) {
              // Set active connection and animate
              window.ChessApp.visualizations.map.instance.activeConnections = [connection];
              window.ChessApp.visualizations.map.instance.animateConnection(connection);
            }
          }
        });
      }
    }
  });